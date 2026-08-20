import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { load as loadYaml } from 'js-yaml';

let markdownProcessorPromise: ReturnType<typeof createMarkdownProcessor> | undefined;

function getMarkdownProcessor() {
  markdownProcessorPromise ??= createMarkdownProcessor();
  return markdownProcessorPromise;
}

export function parseMarkdownDocument(source: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error('Markdown file is missing frontmatter.');
  }

  const frontmatter = loadYaml(match[1] ?? '');
  if (frontmatter === null || typeof frontmatter !== 'object' || Array.isArray(frontmatter)) {
    throw new Error('Markdown frontmatter must be a YAML mapping.');
  }

  return { frontmatter: frontmatter as Record<string, unknown>, body: match[2] ?? '' };
}

const FETCH_TEXT_TTL_MS = 30_000;
const fetchTextCache = new Map<string, { at: number; request: Promise<string> }>();

async function fetchTextUncached(url: URL): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6_000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url.toString()}: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchText(url: URL): Promise<string> {
  const key = url.toString();
  const cached = fetchTextCache.get(key);
  if (cached && Date.now() - cached.at < FETCH_TEXT_TTL_MS) {
    return cached.request;
  }

  const request = fetchTextUncached(url).catch(error => {
    fetchTextCache.delete(key);
    throw error;
  });
  fetchTextCache.set(key, { at: Date.now(), request });
  return request;
}

export async function loadRemoteManifest<T>(url: URL, parser: (raw: string) => T, label: string): Promise<T | null> {
  try {
    return parser(await fetchText(url));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Failed to load remote ${label} manifest: ${message}`);
    return null;
  }
}

export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index] as T);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

export async function renderMarkdownHtml(body: string): Promise<string> {
  const processor = await getMarkdownProcessor();
  const result = await processor.render(body);
  return result.code;
}

export async function loadTextFromRemoteOrLocal(
  source: { mode: 'remote'; contentBaseUrl: URL } | { mode: 'local'; baseDir: string },
  relativePath: string,
  label: string
): Promise<{ raw: string; fileUrl?: URL }> {
  if (source.mode === 'remote') {
    const url = new URL(relativePath, source.contentBaseUrl);
    const basePath = source.contentBaseUrl.pathname.endsWith('/')
      ? source.contentBaseUrl.pathname
      : `${source.contentBaseUrl.pathname}/`;
    if (url.origin !== source.contentBaseUrl.origin || !url.pathname.startsWith(basePath)) {
      throw new Error(`${label} path escapes content base: ${relativePath}`);
    }
    return { raw: await fetchText(url), fileUrl: url };
  }

  const baseDir = resolve(source.baseDir);
  const filePath = resolve(baseDir, relativePath);
  if (filePath !== baseDir && !filePath.startsWith(`${baseDir}${sep}`)) {
    throw new Error(`${label} path escapes export directory: ${relativePath}`);
  }
  return {
    raw: await readFile(filePath, 'utf8'),
    fileUrl: pathToFileURL(filePath),
  };
}
