import type { RehypePlugins } from 'astro';
import type { Loader } from 'astro/loaders';

import { Client, isFullPage, iteratePaginatedAPI } from '@notionhq/client';
import { dim } from 'kleur/colors';
import * as path from 'node:path';

import { propertiesSchemaForDatabase } from './database-properties.js';
import { VIRTUAL_CONTENT_ROOT } from './image.js';
import { buildProcessor, NotionPageRenderer, type RehypePlugin } from './render.js';
import { notionPageSchema } from './schemas/page.js';
import * as transformedPropertySchema from './schemas/transformed-properties.js';
import type { ClientOptions, QueryDatabaseParameters } from './types.js';

export interface NotionLoaderOptions
  extends Pick<ClientOptions, 'auth' | 'timeoutMs' | 'baseUrl' | 'notionVersion' | 'fetch' | 'agent'>,
    Pick<QueryDatabaseParameters, 'database_id' | 'filter_properties' | 'sorts' | 'filter' | 'archived'> {
  /**
   * Pass rehype plugins to customize how the Notion output HTML is processed.
   * You can import and apply the plugin function (recommended), or pass the plugin name as a string.
   */
  rehypePlugins?: RehypePlugins;
  /**
   * The name of the collection, only used for logging and debugging purposes.
   * Useful for multiple loaders to differentiate their logs.
   */
  collectionName?: string;
  /**
   * The path to save the images.
   * Defaults to 'public'.
   */
  publicPath?: string;
  /**
   * MUST STORED IN `src` TO BE PROCESSED PROPERLY
   * The path to save the images relative to `src`.
   * Defaults to 'assets/images/notion'.
   */
  imageSavePath?: string;
  /**
   * Whether to cache images in the data.
   * Defaults to `false`.
   */
  experimentalCacheImageInData?: boolean;
  /**
   * The root alias for the images.
   * Defaults to `src`.
   */
  experimentalRootSourceAlias?: string;
}

const DEFAULT_IMAGE_SAVE_PATH = 'assets/images/notion';

/**
 * Notion loader for the Astro Content Layer API.
 *
 * It allows you to load pages from a Notion database then render them as pages in a collection.
 *
 * @param options Takes in same options as `notionClient.databases.query` and `Client` constructor.
 *
 * @example
 * // src/content/config.ts
 * import { defineCollection } from "astro:content";
 * import { notionLoader } from "notion-astro-loader";
 *
 * const database = defineCollection({
 *   loader: notionLoader({
 *     auth: import.meta.env.NOTION_TOKEN,
 *     database_id: import.meta.env.NOTION_DATABASE_ID,
 *     filter: {
 *       property: "Hidden",
 *       checkbox: { equals: false },
 *     }
 *   }),
 * });
 */
export function notionLoader({
  database_id,
  filter_properties,
  sorts,
  filter,
  archived,
  collectionName,
  imageSavePath = DEFAULT_IMAGE_SAVE_PATH,
  rehypePlugins = [],
  experimentalCacheImageInData = false,
  experimentalRootSourceAlias = 'src',
  ...clientOptions
}: NotionLoaderOptions): Loader {
  const notionClient = new Client(clientOptions);

  const resolvedRehypePlugins = Promise.all(
    rehypePlugins.map(async (config) => {
      let plugin: RehypePlugin | string;
      let options: any;
      if (Array.isArray(config)) {
        [plugin, options] = config;
      } else {
        plugin = config;
      }

      if (typeof plugin === 'string') {
        plugin = (await import(/* @vite-ignore */ plugin)).default as RehypePlugin;
      }
      return [plugin, options] as const;
    })
  );
  const processor = buildProcessor(resolvedRehypePlugins);

  // Simple backoff helper for rate limits
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  return {
    name: collectionName ? `notion-loader/${collectionName}` : 'notion-loader',
    schema: async () =>
      notionPageSchema({
        properties: await propertiesSchemaForDatabase(notionClient, database_id),
      }),
    async load(ctx) {
      const { store, logger: log_db, parseData } = ctx;

      const existingPageIds = new Set<string>(store.keys());
      const renderPromises: Promise<void>[] = [];

      log_db.info(`Loading database ${dim(`found ${existingPageIds.size} pages in store`)}`);

      async function* queryWithBackoff() {
        let start_cursor: string | undefined = undefined;
        let attempts = 0;
        const maxAttempts = 6;
        while (true) {
          try {
            const res = await notionClient.databases.query({
              database_id,
              filter_properties,
              sorts,
              filter,
              archived,
              page_size: 5,
              start_cursor,
            });
            if (process?.env?.DEBUG_NOTION_LOADER === '1') {
              log_db.debug(`Query page_size=5 start_cursor=${start_cursor ?? 'none'} results=${res.results.length} has_more=${res.has_more}`);
            }
            for (const r of res.results) {
              // @ts-ignore
              yield r;
            }
            if (!res.has_more || !res.next_cursor) break;
            start_cursor = res.next_cursor || undefined;
            attempts = 0;
          } catch (e: any) {
            const msg = String(e?.message || e);
            if (msg.includes('rate limited') && attempts < maxAttempts) {
              const wait = Math.min(1000 * Math.pow(2, attempts), 15000);
              log_db.warn(`Rate limited. Backing off for ${wait}ms (attempt ${attempts + 1}/${maxAttempts})`);
              await sleep(wait);
              attempts++;
              continue;
            }
            throw e;
          }
        }
      }

      let pageCount = 0;
      // const pageLimit = 5; // cap during debugging to avoid rate limits

      for await (const page of queryWithBackoff()) {
        if (!isFullPage(page)) {
          continue;
        }

        pageCount++;
        // if (pageCount > pageLimit) {
        //   break;
        // }

        const log_pg = log_db.fork(`${log_db.label}/${page.id.slice(0, 6)}`);

        // Create metadata for logging
        const titleProp = Object.entries(page.properties).find(([_, property]) => property.type === 'title');
        const pageTitle = transformedPropertySchema.title.safeParse(titleProp ? titleProp[1] : {});
        const pageMetadata = [
          `${pageTitle.success ? '"' + pageTitle.data + '"' : 'Untitled'}`,
          `(last edited ${page.last_edited_time.slice(0, 10)})`,
        ].join(' ');

        const isCached = existingPageIds.delete(page.id);
        const existingPage = store.get(page.id);

        // If the page has been updated, re-render it
        if (existingPage?.digest !== page.last_edited_time) {
          const realSavePath = path.resolve(process.cwd(), 'src', imageSavePath);

          const renderer = new NotionPageRenderer(notionClient, page, realSavePath, log_pg);

          const data = await parseData(
            await renderer.getPageData(experimentalCacheImageInData, experimentalRootSourceAlias)
          );

          const renderPromise = (async () => {
            let attempts = 0;
            while (true) {
              try {
                const rendered = await renderer.render(processor);
                store.set({
                  id: page.id,
                  digest: page.last_edited_time,
                  data,
                  rendered,
                  filePath: `${VIRTUAL_CONTENT_ROOT}/${page.id}.md`, // 不重要，有就行
                  assetImports: rendered?.metadata.imagePaths,
                });
                break;
              } catch (e: any) {
                const msg = String(e?.message || e);
                if (msg.includes('rate limited') && attempts < 5) {
                  const wait = Math.min(1000 * Math.pow(2, attempts), 10000);
                  log_pg.warn(`Render rate limited. Backing off for ${wait}ms (attempt ${attempts + 1}/5)`);
                  await sleep(wait);
                  attempts++;
                  continue;
                }
                throw e;
              }
            }
          })();

          renderPromises.push(renderPromise);

          log_pg.info(`${isCached ? 'Updated' : 'Created'} page ${dim(pageMetadata)}`);
        } else {
          log_pg.debug(`Skipped page ${dim(pageMetadata)}`);
        }
      }

      // Remove any pages that have been deleted
      for (const deletedPageId of existingPageIds) {
        const log_pg = log_db.fork(`${log_db.label}/${deletedPageId.slice(0, 6)}`);

        store.delete(deletedPageId);
        log_pg.info(`Deleted page`);
      }

      log_db.info(`Loaded database ${dim(`fetched ${pageCount} pages from API`)}`);

      if (renderPromises.length === 0) {
        return;
      }

      // Wait for rendering to complete
      log_db.info(`Rendering ${renderPromises.length} updated pages`);
      await Promise.all(renderPromises);
      log_db.info(`Rendered ${renderPromises.length} pages`);
    },
  };
}
