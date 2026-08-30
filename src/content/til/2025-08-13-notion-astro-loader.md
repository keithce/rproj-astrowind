---
title: 'Building a Custom Notion Content Loader for Astro'
date: 2025-08-13
tags: ['notion', 'astro', 'content-loader', 'cms']
description: 'Today I learned how to create a custom Astro content loader that fetches pages from a Notion database and treats them as a content collection.'
draft: false
---

# Building a Custom Notion Content Loader for Astro

Notion is a powerful content management system. Today I built a custom content loader to pull Notion database pages into Astro as a first-class content collection.

## The Architecture

Astro v5 introduced pluggable content loaders. This means you can load content from anywhere—not just local files.

```typescript
// vendor/notion-astro-loader/src/index.ts
import { Client } from '@notionhq/client';

export function notionLoader(options) {
  return {
    name: 'notion-loader',
    async load({ store }) {
      const notion = new Client({ auth: options.auth });

      const response = await notion.databases.query({
        database_id: options.database_id,
        filter: options.filter,
      });

      for (const page of response.results) {
        store.set({
          id: page.id,
          data: extractProperties(page),
          body: await getPageContent(page.id),
        });
      }
    },
  };
}
```

## Using It in Collections

```typescript
// src/content/config.ts
const resources = defineCollection({
  loader: notionLoader({
    auth: process.env.NOTION_TOKEN,
    database_id: process.env.NOTION_RESOURCES_DB,
    filter: { property: 'Status', status: { equals: 'Published' } },
  }),
  schema: () =>
    z.object({
      Name: z.string(),
      Category: z.array(z.string()),
      // ... other properties
    }),
});
```

## Key Insight

By vendoring the loader locally, I can customize it for specific needs like image caching, property flattening, and custom rendering. It's the best of both worlds: Notion's excellent editing experience with Astro's static site performance.
