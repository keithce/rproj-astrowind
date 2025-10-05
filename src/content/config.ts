import { defineCollection, z } from 'astro:content';
// Use vendored loader source so we can modify locally
import { notionLoader } from '../../vendor/notion-astro-loader/src';
import type { Loader } from 'astro/loaders';
import { glob } from 'astro/loaders';

// Shared metadataDefinition for collections
const metadataDefinition = () =>
  z
    .object({
      title: z.string().optional(),
      ignoreTitleTemplate: z.boolean().optional(),

      canonical: z.string().url().optional(),

      robots: z
        .object({
          index: z.boolean().optional(),
          follow: z.boolean().optional(),
        })
        .optional(),

      description: z.string().optional(),

      openGraph: z
        .object({
          url: z.string().optional(),
          siteName: z.string().optional(),
          images: z
            .array(
              z.object({
                url: z.string(),
                width: z.number().optional(),
                height: z.number().optional(),
              })
            )
            .optional(),
          locale: z.string().optional(),
          type: z.string().optional(),
        })
        .optional(),

      twitter: z
        .object({
          handle: z.string().optional(),
          site: z.string().optional(),
          cardType: z.string().optional(),
        })
        .optional(),
    })
    .optional();

const postCollection = defineCollection({
  loader: glob({ pattern: ['**/*.md', '**/*.mdx'], base: 'src/data/post' }),
  schema: ({ image }) =>
    z.object({
      publishDate: z.date().optional(),
      updateDate: z.date().optional(),
      draft: z.boolean().optional(),

      title: z.string(),
      excerpt: z.string().optional(),
      image: image().optional(),

      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      author: z.string().optional(),

      metadata: metadataDefinition(),
    }),
});

const tilCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()),
    description: z.string(),
    draft: z.boolean().optional(),
    image: z.string().optional(),
    metadata: metadataDefinition(),
  }),
});

export const collections = {
  post: postCollection,
  til: tilCollection,
  resources: defineCollection({
    loader: (() => {
      // Load environment variables at runtime instead of module initialization
      const token = process.env.NOTION_TOKEN;
      const db = process.env.NOTION_RR_RESOURCES_ID;

      if (!token || !db) {
        // Gracefully no-op when secrets are absent (CI/docs preview)
        const emptyLoader: Loader = {
          name: 'notion-loader/disabled',
          async schema() {
            return z.object({}).optional();
          },
          async load(ctx) {
            // ensure store cleared to avoid stale content
            for (const id of ctx.store.keys()) ctx.store.delete(id);
          },
        };
        return emptyLoader;
      }

      return notionLoader({
        auth: token,
        database_id: db,
        imageSavePath: 'assets/images/notion',
        filter: {
          property: 'Status',
          status: { equals: 'Up-to-Date' },
        },
      });
    })(),
    // Schema: start from Notion property types; refine as needed
    schema: () =>
      z.object({
        // Include raw Notion properties so we can derive titles when needed
        properties: z.any().optional(),
        // Flattened map of all property values for convenient access
        flat: z.record(z.unknown()).optional(),
        Name: z.string().optional(),
        Source: z.string().url().optional(),
        'User Defined URL': z.string().url().optional(),
        Category: z.array(z.string()).optional(),
        Type: z.array(z.string()).optional(),
        Tags: z.array(z.string()).optional(),
        Keywords: z.array(z.string()).optional(),
        Status: z.enum(['Needs Review', 'Writing', 'Needs Update', 'Up-to-Date']).optional(),
        Length: z.enum(['Short', 'Medium', 'Long']).optional(),
        'AI summary': z.string().optional(),
        'Last Updated': z.union([z.date(), z.string()]).optional(),
        'Skill Level': z.enum(['Beginner', 'Intermediate', 'Advanced', 'Any']).optional(),
        Favorite: z.boolean().optional(),
      }),
  }),
};
