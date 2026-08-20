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

  return {
    frontmatter: loadYaml(match[1] ?? '') as Record<string, unknown>,
    body: match[2] ?? '',
  };
}

const fetchTextCache = new Map<string, Promise<string>>();

async function fetchTextUncached(url: URL): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6_000);

  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url.toString()}: ${response.status} ${response.statusText}`);
  }
  return await response.text();
}

export async function fetchText(url: URL): Promise<string> {
  const key = url.toString();
  const cached = fetchTextCache.get(key);
  if (cached) {
    return cached;
  }

  const request = fetchTextUncached(url).catch(error => {
    fetchTextCache.delete(key);
    throw error;
  });
  fetchTextCache.set(key, request);
  return request;
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
