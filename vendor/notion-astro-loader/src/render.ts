import type { AstroIntegrationLogger, MarkdownHeading } from 'astro';
import type { ParseDataOptions } from 'astro/loaders';

// #region Processor
import * as fse from 'fs-extra';
import notionRehype from 'notion-rehype-k';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import { unified, type Plugin } from 'unified';
import { type VFile } from 'vfile';

// TOC plugin disabled
import { isFullBlock, iteratePaginatedAPI, type Client } from '@notionhq/client';
import { dim } from 'kleur/colors';

import { fileToUrl, richTextToPlainText, dateToDateObjects } from './format.js';
import { saveImageFromAWS, transformImagePathForCover } from './image.js';
import { rehypeImages } from './rehype/rehype-images.js';
import { rehypeEnsureProps } from './rehype/rehype-ensure-props.js';
import { rehypeCleanText } from './rehype/rehype-clean-text.js';
import { rehypeNormalize } from './rehype/rehype-normalize.js';
import { rehypeSanitizeRecursive } from './rehype/rehype-sanitize-recursive.js';
import type { FileObject, NotionPageData, PageObjectResponse } from './types.js';

// Base plugins used after sanitization. We intentionally build the processor
// in buildProcessor so that sanitization happens BEFORE other plugins like KaTeX.
// Note: rehype-katex expects element.properties to always exist; ensure our
// props normalizer runs BEFORE it (done below) and run katex AFTER clean/text/images.
const baseAfterSanitizePlugins: [RehypePlugin, any?][] = [
  [rehypeSlug, undefined],
  [rehypeStringify, undefined],
];

export type RehypePlugin = Plugin<any[], any>;

export function buildProcessor(rehypePlugins: Promise<ReadonlyArray<readonly [RehypePlugin, any]>>) {
  let headings: MarkdownHeading[] = [];

  const pluginsPromise = rehypePlugins.then((plugins) => plugins as unknown as [RehypePlugin, any?][]);

  return async function processBlocks(blocks: unknown[], imagePaths: string[]) {
    // Build the processor lazily so we can control ordering strictly
    const sanitizerMode = globalThis?.process?.env?.NOTION_SANITIZER_MODE === 'visitor' ? 'visitor' : 'recursive';
    const extraPlugins = await pluginsPromise;

    let chain = unified().use(notionRehype as any);

    // Sanitize FIRST so downstream plugins (like KaTeX) can rely on structure
    if (sanitizerMode === 'recursive') {
      chain = (chain as any).use(rehypeSanitizeRecursive() as any);
    } else {
      chain = (chain as any).use(rehypeNormalize() as any);
    }

    // Normalize basic props before any downstream plugin expects them
    chain = (chain as any).use(rehypeEnsureProps() as any);

    // Apply any caller-provided rehype plugins (pre-image, pre-stringify)
    for (const [plugin, options] of extraPlugins) {
      chain = (chain as any).use(plugin as any, options as any);
    }

    // Clean text artifacts and fix hrefs (ensures stable text before katex)
    chain = (chain as any).use(rehypeCleanText() as any);

    // Handle images before katex/stringify
    chain = (chain as any).use(rehypeImages() as any, { imagePaths } as any);

    // Ensure props again in case upstream plugins introduced new elements
    chain = (chain as any).use(rehypeEnsureProps() as any);

    // Optionally apply KaTeX once structure is normalized and props exist
    if (globalThis?.process?.env?.NOTION_KATEX === '1') {
      // @ts-ignore
      chain = (chain as any).use(rehypeKatex as any);
    }

    // Our base plugins after sanitize
    for (const [plugin, options] of baseAfterSanitizePlugins) {
      chain = (chain as any).use(plugin as any, options as any);
    }

    const vFile = (await chain.process({ data: blocks } as unknown as Record<string, unknown>)) as VFile;
    
    // Populate headings from vFile.data
    headings = (vFile.data?.headings as MarkdownHeading[]) || [];
    
    if (globalThis?.process?.env?.NOTION_TRACE === '1') {
      try {
        const output = String(vFile);
        const head = output.slice(0, 200).replace(/\s+/g, ' ');
        const tail = output.slice(-200).replace(/\s+/g, ' ');
        // eslint-disable-next-line no-console
        console.debug(`[notion-trace] render htmlLen=${output.length} head="${head}" tail="${tail}"`);
      } catch {}
    }
    return { vFile, headings };
  };
}
// #endregion

async function awaitAll<T>(iterable: AsyncIterable<T>) {
  const result: T[] = [];
  for await (const item of iterable) {
    result.push(item);
  }
  return result;
}

/**
 * Return a generator that yields all blocks in a Notion page, recursively.
 * @param blockId ID of block to get children for.
 * @param fetchImage Function that fetches an image and returns a local path.
 */
async function* listBlocks(client: Client, blockId: string, fetchImage: (file: FileObject) => Promise<string>) {
  for await (const block of iteratePaginatedAPI(client.blocks.children.list, {
    block_id: blockId,
  })) {
    if (!isFullBlock(block)) {
      continue;
    }

    // Ensure the container for current block type exists to avoid `'in' of undefined` in downstream plugins
    const typeKey = (block as any).type;
    if ((block as any)[typeKey] == null) {
      (block as any)[typeKey] = {};
    }
    // Ensure children array exists to satisfy downstream checks like `'children' in ...`
    if (!('children' in (block as any)[typeKey])) {
      (block as any)[typeKey].children = [];
    }

    if (block.has_children) {
      const children = await awaitAll(listBlocks(client, block.id, fetchImage));
      // Safely attach children for downstream processors
      const container: any = (block as any)[block.type];
      if (container && typeof container === 'object') {
        container.children = children;
      } else {
        (block as any)[block.type] = { ...(container ?? {}), children };
      }
    }

    // Specialized handling for image blocks
    if (block.type === 'image') {
      // Fetch remote image and store it locally
      const url = await fetchImage(block.image);
      // Force all images to be treated as file type so they get processed by rehypeImages
      yield {
        ...block,
        image: {
          type: 'file', // Force file type instead of original type
          file: url,    // Use 'file' property instead of dynamic property
          caption: block.image.caption,
        },
      };
    } else {
      yield block;
    }
  }
}

function extractTocHeadings(): MarkdownHeading[] { return []; }

export interface RenderedNotionEntry {
  html: string;
  metadata: {
    imagePaths: string[];
    headings: MarkdownHeading[];
  };
}

export class NotionPageRenderer {
  #imagePaths: string[] = [];
  #imageAnalytics: Record<'download' | 'cached', number> = {
    download: 0,
    cached: 0,
  };
  #logger: AstroIntegrationLogger;

  /**
   * @param client Notion API client.
   * @param page Notion page object including page ID and properties. Does not include blocks.
   * @param parentLogger Logger to use for logging messages.
   */
  constructor(
    private readonly client: Client,
    private readonly page: PageObjectResponse,
    public readonly imageSavePath: string,
    logger: AstroIntegrationLogger
  ) {
    this.#logger = logger.fork(`${logger.label}/render`);
  }

  /**
   * Return page properties for Astro to use.
   */
  async getPageData(transformCoverImage = false, rootAlias = 'src'): Promise<ParseDataOptions<NotionPageData>> {
    const { page } = this;
    let cover = page.cover;
    // transform cover image file
    if (cover && transformCoverImage && cover.type === 'file') {
      const fetchedImagePath = await this.#fetchImage(cover);
      if (fetchedImagePath && !/^https?:\/\//.test(fetchedImagePath)) {
        const transformedUrl = `${rootAlias}/${transformImagePathForCover(fetchedImagePath)}`;
        cover = {
          ...cover,
          file: {
            ...cover.file,
            url: transformedUrl,
          },
        };
      }
    }
    // Transform Notion raw properties to simple values and also expose them at top-level for convenience
    const transformed: Record<string, unknown> = {};
    try {
      for (const [propName, prop] of Object.entries(page.properties as Record<string, any>)) {
        const t = (prop as any)?.type;
        let value: unknown = undefined;
        switch (t) {
          case 'number':
            value = prop.number;
            break;
          case 'url':
            try {
              const u = prop.url ?? undefined;
              if (typeof u === 'string' && u.trim().length > 0) {
                // Accept only valid URL strings to satisfy strict schemas
                // If invalid, drop to undefined to avoid breaking sync
                new URL(u);
                value = u;
              } else {
                value = undefined;
              }
            } catch {
              value = undefined;
            }
            break;
          case 'email':
            value = prop.email ?? undefined;
            break;
          case 'phone_number':
            value = prop.phone_number ?? undefined;
            break;
          case 'checkbox':
            value = prop.checkbox;
            break;
          case 'select':
            value = prop.select?.name ?? null;
            break;
          case 'multi_select':
            value = Array.isArray(prop.multi_select) ? prop.multi_select.map((o: any) => o?.name).filter(Boolean) : [];
            break;
          case 'status':
            value = prop.status?.name ?? null;
            break;
          case 'title':
            value = richTextToPlainText(prop.title as ReadonlyArray<{ plain_text?: string }>);
            break;
          case 'rich_text':
            value = richTextToPlainText(prop.rich_text as ReadonlyArray<{ plain_text?: string }>);
            break;
          case 'date':
            // Preserve the full date object structure (start, end, time_zone)
            value = dateToDateObjects(prop.date as any);
            break;
          case 'created_time':
            value = new Date(prop.created_time);
            break;
          case 'last_edited_time':
            // Keep as ISO string to satisfy zod union (string | date)
            value = prop.last_edited_time as string;
            break;
          default:
            // Pass-through for unhandled types (files, people, relation, etc.)
            value = prop;
        }
        // Only assign present, non-null values. Optional schema fields should be omitted when empty.
        if (value !== null && value !== undefined) {
          transformed[propName] = value;
        }
      }
    } catch {}

    return {
      id: page.id,
      data: {
        icon: page.icon,
        cover,
        archived: page.archived,
        in_trash: page.in_trash,
        url: page.url,
        public_url: page.public_url,
        properties: page.properties,
        // flatten for direct access (e.g., data.Name, data.Tags)
        ...transformed,
        // also provide a dedicated map of flattened values for all properties
        flat: transformed as unknown as Record<string, unknown>,
      },
    };
  }

  /**
   * Return rendered HTML for the page.
   * @param process Processor function to transform Notion blocks into HTML.
   * This is created once for all pages then shared.
   */
  async render(process: ReturnType<typeof buildProcessor>): Promise<RenderedNotionEntry | undefined> {
    this.#logger.debug('Rendering page');

    try {
      let blocks = await awaitAll(listBlocks(this.client, this.page.id, this.#fetchImage));
      blocks = sanitizeBlocks(blocks);

      // Optional verbose debugging for difficult pages
      const DEBUG = globalThis?.process?.env?.DEBUG_NOTION_LOADER === '1';
      if (DEBUG) {
        try {
          const sample = blocks.slice(0, 50).map((b: any) => {
            const type = b?.type;
            const c = type ? b?.[type] : undefined;
            return {
              id: b?.id,
              type,
              has_children: b?.has_children,
              container_keys: c ? Object.keys(c) : null,
              children_len: Array.isArray(c?.children) ? c.children.length : null,
            };
          });
          this.#logger.debug(`Sample blocks (first ${sample.length}): ${JSON.stringify(sample, null, 2)}`);
        } catch {}
      }

      if (this.#imageAnalytics.download > 0 || this.#imageAnalytics.cached > 0) {
        this.#logger.info(
          [
            `Found ${this.#imageAnalytics.download} images to download`,
            this.#imageAnalytics.cached > 0 && dim(`${this.#imageAnalytics.cached} already cached`),
          ].filter(Boolean).join(' ')
        );
      }

      const { vFile, headings } = await process(blocks, this.#imagePaths);

      this.#logger.debug('Rendered page');

      return {
        html: vFile.toString(),
        metadata: {
          headings,
          imagePaths: this.#imagePaths,
        },
      };
    } catch (error) {
      // Include full stack and a quick peek at problem shape
      this.#logger.error(`Failed to render: ${getErrorMessage(error)}`);
      try {
        // Print a short summary of block types to help identify problematic shapes
        const blocks = sanitizeBlocks(await awaitAll(listBlocks(this.client, this.page.id, this.#fetchImage)));
        const summary = blocks.map((b: any) => b?.type).filter(Boolean).slice(0, 20).join(', ');
        this.#logger.debug(`Block types: ${summary}${blocks.length > 20 ? ', ...' : ''}`);
        if (globalThis?.process?.env?.DEBUG_NOTION_LOADER === '1') {
          // Persist full sanitized blocks for deep inspection
          const tmpDir = `${(globalThis as any).process?.cwd?.() ?? ''}/tmp`;
          fse.ensureDirSync(tmpDir);
          const dumpPath = `${tmpDir}/notion-blocks-${this.page.id.slice(0, 6)}.json`;
          await fse.writeJSON(dumpPath, blocks, { spaces: 2 });
          this.#logger.debug(`Dumped sanitized blocks to ${dumpPath}`);
        }
      } catch {}
      // Fallback: minimal safe renderer to avoid total failure while we iterate fixes
      try {
        const safeBlocks = await awaitAll(listBlocks(this.client, this.page.id, this.#fetchImage));
        const html = minimalHtmlFromBlocks(safeBlocks);
        return {
          html,
          metadata: { headings: [], imagePaths: this.#imagePaths },
        };
      } catch (fallbackErr) {
        this.#logger.error(`Fallback render failed: ${getErrorMessage(fallbackErr)}`);
        return undefined;
      }
    }
  }

  /**
   * Helper function to convert remote Notion images into local images in Astro.
   * Additionally saves the path in `this.#imagePaths`.
   * @param imageFileObject Notion file object representing an image.
   * @returns Local path to the image, or undefined if the image could not be fetched.
   */
  #fetchImage: (imageFileObject: FileObject) => Promise<string> = async (imageFileObject) => {
    try {
      // Always try to download and save images locally, regardless of type
      // This ensures all images are processed by the rehypeImages plugin
      fse.ensureDirSync(this.imageSavePath);

      let imageUrl: string;
      
      if (imageFileObject.type === 'external') {
        // For external images, use the external URL
        imageUrl = imageFileObject.external.url;
      } else {
        // For file images, use the file URL
        imageUrl = imageFileObject.file.url;
      }

      console.log('fetchImage: Processing image URL:', imageUrl);

      // Download and save the image locally
      const localPath = await saveImageFromAWS(imageUrl, this.imageSavePath, {
        log: (message) => {
          this.#logger.debug(message);
        },
        tag: (type) => {
          this.#imageAnalytics[type]++;
        },
      });
      
      console.log('fetchImage: Saved image to local path:', localPath);
      this.#imagePaths.push(localPath);
      console.log('fetchImage: Total imagePaths:', this.#imagePaths.length);
      return localPath;
    } catch (error) {
      this.#logger.error(`Failed to fetch image: ${getErrorMessage(error)}`);
      // Fall back to using the remote URL directly.
      return fileToUrl(imageFileObject);
    }
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.message}${error.stack ? `\n${error.stack}` : ''}`;
  } else if (typeof error === 'string') {
    return error;
  } else {
    return 'Unknown error';
  }
}

// Extremely defensive minimal renderer used only as a last-resort fallback
function minimalHtmlFromBlocks(blocks: any[]): string {
  const out: string[] = [];
  let bulletedBuf: string[] = [];
  let numberedBuf: string[] = [];

  const flushLists = () => {
    if (bulletedBuf.length > 0) {
      out.push(`<ul>${bulletedBuf.join('\n')}</ul>`);
      bulletedBuf = [];
    }
    if (numberedBuf.length > 0) {
      out.push(`<ol>${numberedBuf.join('\n')}</ol>`);
      numberedBuf = [];
    }
  };

  for (const b of blocks) {
    const t = b?.type;

    if (t === 'bulleted_list_item') {
      const texts = b?.[t]?.rich_text || [];
      const content = texts.map((rt: any) => rt?.plain_text || '').join('');
      // If switching from numbered to bulleted, flush the numbered list first
      if (numberedBuf.length > 0) {
        out.push(`<ol>${numberedBuf.join('\n')}</ol>`);
        numberedBuf = [];
      }
      bulletedBuf.push(`<li>${escapeHtml(content)}</li>`);
      continue;
    }

    if (t === 'numbered_list_item') {
      const texts = b?.[t]?.rich_text || [];
      const content = texts.map((rt: any) => rt?.plain_text || '').join('');
      // If switching from bulleted to numbered, flush the bulleted list first
      if (bulletedBuf.length > 0) {
        out.push(`<ul>${bulletedBuf.join('\n')}</ul>`);
        bulletedBuf = [];
      }
      numberedBuf.push(`<li>${escapeHtml(content)}</li>`);
      continue;
    }

    // Flush any pending lists before other block types
    flushLists();

    if (t === 'paragraph') {
      const texts = b?.paragraph?.rich_text || [];
      const content = texts.map((rt: any) => rt?.plain_text || '').join('');
      out.push(`<p>${escapeHtml(content)}</p>`);
    } else if (t === 'heading_1' || t === 'heading_2' || t === 'heading_3') {
      const level = t === 'heading_1' ? 'h1' : t === 'heading_2' ? 'h2' : 'h3';
      const texts = b?.[t]?.rich_text || [];
      const content = texts.map((rt: any) => rt?.plain_text || '').join('');
      out.push(`<${level}>${escapeHtml(content)}</${level}>`);
    } else if (t === 'quote') {
      const texts = b?.quote?.rich_text || [];
      const content = texts.map((rt: any) => rt?.plain_text || '').join('');
      out.push(`<blockquote>${escapeHtml(content)}</blockquote>`);
    }
  }

  // Flush any remaining lists at the end
  flushLists();

  return out.join('\n');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Defensive cleanup for blocks before sending to rehype pipeline
function sanitizeBlocks(blocks: any[]): any[] {
  return (blocks || []).map((b) => {
    if (!b || typeof b !== 'object') return b;
    const type = (b as any).type;
    if (typeof type !== 'string') return b;
    const container = (b as any)[type];
    // ensure container exists and always has children array
    if (!container || typeof container !== 'object') {
      (b as any)[type] = { children: [] };
    } else if (!('children' in container)) {
      (container as any).children = [];
    }
    return b;
  });
}
