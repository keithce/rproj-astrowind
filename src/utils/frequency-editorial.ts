import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { FREQUENCY_EXPORTS_DIR, getEditorialContentBaseUrl, getEditorialManifestUrl } from '~/utils/frequency';
import {
  fetchText,
  loadTextFromRemoteOrLocal,
  parseMarkdownDocument,
  renderMarkdownHtml,
} from '~/utils/frequency-markdown';

export {
  fetchText,
  parseMarkdownDocument,
  renderMarkdownHtml as renderEditorialMarkdown,
} from '~/utils/frequency-markdown';

export const EDITORIAL_KINDS = [
  'experiment_recap',
  'what_changed_my_mind',
  'campaign_summary',
  'thesis_summary',
] as const;

export const EVIDENCE_STATUSES = ['supported', 'mixed', 'speculative'] as const;

export type EditorialKind = (typeof EDITORIAL_KINDS)[number];
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export interface EditorialManifestEntry {
  slug: string;
  path: string;
  title: string;
  kind: EditorialKind;
  publishedAt: number;
  evidenceStatus: EvidenceStatus;
}

export interface EditorialManifest {
  version: 'public_editorial_v1';
  generatedAt?: string;
  items: EditorialManifestEntry[];
}

export interface EditorialFrontmatter {
  title: string;
  slug: string;
  kind: EditorialKind;
  publishedAt: Date;
  dek: string;
  evidenceStatus: EvidenceStatus;
  uncertaintySummary: string;
  whyItMatters: string;
  campaignSlug?: string;
  thesisSlugs?: string[];
  canonicalAppUrl: string;
}

export interface LiveEditorialEntry {
  id: string;
  data: EditorialFrontmatter;
  body: string;
  html: string;
  fileUrl?: URL;
}

export type EditorialManifestSource =
  | {
      mode: 'remote';
      manifestUrl: URL;
      contentBaseUrl: URL;
      manifest: EditorialManifest;
    }
  | {
      mode: 'local';
      baseDir: string;
      manifest: EditorialManifest;
    };

export function parseEditorialManifest(raw: string): EditorialManifest {
  const parsed = JSON.parse(raw) as Partial<EditorialManifest>;
  if (parsed.version !== 'public_editorial_v1' || !Array.isArray(parsed.items)) {
    throw new Error('Editorial manifest is missing the public_editorial_v1 contract.');
  }
  return parsed as EditorialManifest;
}

export async function loadEditorialManifestSource(): Promise<EditorialManifestSource | null> {
  const manifestLocation = getEditorialManifestUrl();
  const contentBaseUrl = getEditorialContentBaseUrl();
  try {
    const manifest = parseEditorialManifest(await fetchText(manifestLocation));
    return {
      mode: 'remote',
      manifestUrl: manifestLocation,
      contentBaseUrl,
      manifest,
    };
  } catch {
    // Remote fetch failed — fall through to a local export dir when one is configured.
  }

  if (FREQUENCY_EXPORTS_DIR !== null) {
    const manifestPath = join(FREQUENCY_EXPORTS_DIR, 'public-editorial', 'v1', 'manifest.json');

    let manifestRaw: string;
    try {
      manifestRaw = await readFile(manifestPath, 'utf8');
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }

    return {
      mode: 'local',
      baseDir: join(FREQUENCY_EXPORTS_DIR, 'public-editorial', 'v1'),
      manifest: parseEditorialManifest(manifestRaw),
    };
  }

  return null;
}

export async function loadEditorialMarkdownEntry(
  source: EditorialManifestSource,
  relativePath: string
): Promise<{ raw: string; fileUrl?: URL }> {
  return loadTextFromRemoteOrLocal(source, relativePath, 'Editorial');
}

function isEditorialKind(value: unknown): value is EditorialKind {
  return typeof value === 'string' && (EDITORIAL_KINDS as readonly string[]).includes(value);
}

function isEvidenceStatus(value: unknown): value is EvidenceStatus {
  return typeof value === 'string' && (EVIDENCE_STATUSES as readonly string[]).includes(value);
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter((item): item is string => typeof item === 'string');
  return items.length > 0 ? items : undefined;
}

export function editorialFrontmatterFromRaw(
  raw: Record<string, unknown>,
  fallback: Pick<EditorialManifestEntry, 'slug' | 'title' | 'kind' | 'publishedAt' | 'evidenceStatus'>
): EditorialFrontmatter {
  const publishedAtValue = raw.publishedAt;
  const publishedAt =
    publishedAtValue instanceof Date
      ? publishedAtValue
      : typeof publishedAtValue === 'string' || typeof publishedAtValue === 'number'
        ? new Date(publishedAtValue)
        : new Date(fallback.publishedAt);

  const canonical = raw.canonicalAppUrl;
  if (typeof canonical !== 'string' || !URL.canParse(canonical)) {
    throw new Error(`Editorial entry "${fallback.slug}" is missing a valid canonicalAppUrl.`);
  }

  return {
    title: typeof raw.title === 'string' ? raw.title : fallback.title,
    slug: typeof raw.slug === 'string' ? raw.slug : fallback.slug,
    kind: isEditorialKind(raw.kind) ? raw.kind : fallback.kind,
    publishedAt,
    dek: typeof raw.dek === 'string' ? raw.dek : '',
    evidenceStatus: isEvidenceStatus(raw.evidenceStatus) ? raw.evidenceStatus : fallback.evidenceStatus,
    uncertaintySummary: typeof raw.uncertaintySummary === 'string' ? raw.uncertaintySummary : '',
    whyItMatters: typeof raw.whyItMatters === 'string' ? raw.whyItMatters : '',
    campaignSlug: typeof raw.campaignSlug === 'string' ? raw.campaignSlug : undefined,
    thesisSlugs: toStringArray(raw.thesisSlugs),
    canonicalAppUrl: canonical,
  };
}

export async function loadLiveEditorialEntries(): Promise<LiveEditorialEntry[]> {
  const source = await loadEditorialManifestSource();
  if (!source) {
    return [];
  }

  const entries: LiveEditorialEntry[] = [];
  for (const item of source.manifest.items) {
    try {
      const { raw, fileUrl } = await loadEditorialMarkdownEntry(source, item.path);
      const { frontmatter, body } = parseMarkdownDocument(raw);
      const data = editorialFrontmatterFromRaw(frontmatter, item);
      const html = await renderMarkdownHtml(body);
      entries.push({
        id: item.slug,
        data,
        body,
        html,
        fileUrl,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to load editorial entry "${item.slug}": ${message}`);
    }
  }

  return entries.sort((left, right) => right.data.publishedAt.getTime() - left.data.publishedAt.getTime());
}

export async function loadLiveEditorialEntry(slug: string): Promise<LiveEditorialEntry | undefined> {
  const source = await loadEditorialManifestSource();
  if (!source) {
    return undefined;
  }

  const item = source.manifest.items.find(entry => entry.slug === slug);
  if (!item) {
    return undefined;
  }

  const { raw, fileUrl } = await loadEditorialMarkdownEntry(source, item.path);
  const { frontmatter, body } = parseMarkdownDocument(raw);
  const data = editorialFrontmatterFromRaw(frontmatter, item);
  const html = await renderMarkdownHtml(body);
  return { id: item.slug, data, body, html, fileUrl };
}
