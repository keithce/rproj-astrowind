import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { FREQUENCY_EXPORTS_DIR, getEssayContentBaseUrl, getEssayManifestUrl } from '~/utils/frequency';
import {
  fetchText,
  loadTextFromRemoteOrLocal,
  parseMarkdownDocument,
  renderMarkdownHtml,
} from '~/utils/frequency-markdown';

export interface EssayManifestItem {
  slug: string;
  path: string;
  title: string;
  publishDate: string | null;
  category: string;
}

export interface EssayManifest {
  version: 'frequency_essays_v1';
  generatedAt?: string;
  items: EssayManifestItem[];
}

export interface LiveEssay {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  publishDate: Date;
  updateDate?: Date;
  category?: string;
  tags: string[];
  author?: string;
  draft: boolean;
  image?: string;
  html?: string;
}

type ManifestSource =
  | {
      mode: 'remote';
      contentBaseUrl: URL;
      manifest: EssayManifest;
    }
  | {
      mode: 'local';
      baseDir: string;
      manifest: EssayManifest;
    };

export function parseEssayManifest(raw: string): EssayManifest {
  const parsed = JSON.parse(raw) as Partial<EssayManifest>;
  if (parsed.version !== 'frequency_essays_v1' || !Array.isArray(parsed.items)) {
    throw new Error('Essay manifest is missing the frequency_essays_v1 contract.');
  }
  return parsed as EssayManifest;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function toDate(value: unknown, fallback: Date): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return fallback;
}

export async function loadEssayManifestSource(): Promise<ManifestSource | null> {
  const manifestLocation = getEssayManifestUrl();
  const contentBaseUrl = getEssayContentBaseUrl();
  try {
    const manifest = parseEssayManifest(await fetchText(manifestLocation));
    return {
      mode: 'remote',
      contentBaseUrl,
      manifest,
    };
  } catch {
    // Remote fetch failed — fall through to a local export dir when one is configured.
  }

  if (FREQUENCY_EXPORTS_DIR !== null) {
    const manifestPath = join(FREQUENCY_EXPORTS_DIR, 'blog', 'manifest.json');

    let manifestRaw: string;
    try {
      manifestRaw = await readFile(manifestPath, 'utf8');
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }

    return {
      mode: 'local',
      baseDir: join(FREQUENCY_EXPORTS_DIR, 'blog'),
      manifest: parseEssayManifest(manifestRaw),
    };
  }

  return null;
}

export async function loadEssayMarkdownEntry(
  source: ManifestSource,
  relativePath: string
): Promise<{ raw: string; fileUrl?: URL }> {
  return loadTextFromRemoteOrLocal(source, relativePath, 'Essay');
}

export function liveEssayFromRaw(raw: Record<string, unknown>, item: EssayManifestItem, html?: string): LiveEssay {
  const fallbackDate = item.publishDate ? new Date(item.publishDate) : new Date(0);
  const category = typeof raw.category === 'string' ? raw.category : item.category || undefined;
  const image = typeof raw.image === 'string' ? raw.image : undefined;

  return {
    id: `essay/${item.slug}`,
    slug: item.slug,
    title: typeof raw.title === 'string' ? raw.title : item.title,
    excerpt: typeof raw.excerpt === 'string' ? raw.excerpt : undefined,
    publishDate: toDate(raw.publishDate, fallbackDate),
    updateDate:
      raw.updateDate instanceof Date || typeof raw.updateDate === 'string'
        ? toDate(raw.updateDate, fallbackDate)
        : undefined,
    category: category || undefined,
    tags: toStringArray(raw.tags),
    author: typeof raw.author === 'string' ? raw.author : undefined,
    draft: raw.draft === true,
    image,
    html,
  };
}

async function loadEssayFromItem(
  source: ManifestSource,
  item: EssayManifestItem,
  renderHtml: boolean
): Promise<LiveEssay> {
  const { raw } = await loadEssayMarkdownEntry(source, item.path);
  const { frontmatter, body } = parseMarkdownDocument(raw);
  const html = renderHtml ? await renderMarkdownHtml(body) : undefined;
  return liveEssayFromRaw(frontmatter, item, html);
}

export async function loadLiveEssays(): Promise<LiveEssay[]> {
  const source = await loadEssayManifestSource();
  if (!source) {
    return [];
  }

  const results = await Promise.all(
    source.manifest.items.map(async item => {
      try {
        return await loadEssayFromItem(source, item, false);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Failed to load essay ${item.slug}: ${message}`);
        return null;
      }
    })
  );

  return results
    .filter((essay): essay is LiveEssay => essay !== null)
    .sort((left, right) => right.publishDate.getTime() - left.publishDate.getTime());
}

export async function loadLiveEssay(idOrSlug: string): Promise<LiveEssay | undefined> {
  const source = await loadEssayManifestSource();
  if (!source) {
    return undefined;
  }

  const slug = idOrSlug.startsWith('essay/') ? idOrSlug.slice('essay/'.length) : idOrSlug;
  const item = source.manifest.items.find(entry => entry.slug === slug);
  if (!item) {
    return undefined;
  }

  return loadEssayFromItem(source, item, true);
}
