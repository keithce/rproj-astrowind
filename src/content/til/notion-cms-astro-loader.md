---
title: 'Using Notion as a CMS with Astro'
date: 2025-01-03
tags: ['astro', 'notion', 'cms', 'headless']
description: 'Today I learned how to use Notion as a headless CMS for Astro using a custom loader with live content sync.'
draft: false
---

# Using Notion as a CMS with Astro

Notion makes a surprisingly capable headless CMS when paired with Astro's content loaders. I built a custom loader that syncs Notion database content into Astro's content collection system.

## The Loader Pattern

Astro 5's experimental `loaders` feature lets you define custom content sources:

```typescript
// src/content/config.ts
import { notionLoader } from '../vendor/notion-astro-loader/src';

export const collections = {
  resources: defineCollection({
    loader: notionLoader({
      auth: process.env.NOTION_TOKEN!,
      database_id: process.env.NOTION_RR_RESOURCES_ID!,
      imageSavePath: 'content/notion/images',
      filter: {
        property: 'Status',
        status: { equals: 'Up-to-Date' },
      },
    }),
    schema: () =>
      z.object({
        Name: z.string().optional(),
        Category: z.array(z.string()).optional(),
        Tags: z.array(z.string()).optional(),
        'AI summary': z.string().optional(),
      }),
  }),
};
```

## Property Mapping

Notion's property types need translation to Zod schemas:

| Notion Type  | Zod Schema            |
| ------------ | --------------------- |
| Title        | `z.string()`          |
| Select       | `z.string()`          |
| Multi-select | `z.array(z.string())` |
| Date         | `z.date()`            |
| Checkbox     | `z.boolean()`         |
| URL          | `z.string().url()`    |

## Live Content Sync

Enable experimental live content collections for dev server hot-reload:

```typescript
// astro.config.ts
export default defineConfig({
  experimental: {
    liveContentCollections: true,
  },
});
```

Changes in Notion update in the browser within seconds during development.

## Image Handling

The loader downloads Notion images to a local directory, preventing broken image URLs when Notion's signed URLs expire:

```typescript
notionLoader({
  imageSavePath: 'content/notion/images',
  // Images get downloaded and served locally
});
```

## Key Insight

Notion works well for non-technical content editors. The structured database format maps cleanly to typed content collections. The main gotcha is Notion's rate limits—cache aggressively and use incremental sync for larger datasets.
