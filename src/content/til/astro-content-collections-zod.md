---
title: 'Astro Content Collections with Zod Schemas'
date: 2025-01-06
tags: ['astro', 'typescript', 'zod', 'content']
description: 'Today I learned how to build type-safe content collections in Astro using Zod schemas for validation and TypeScript inference.'
draft: false
---

# Astro Content Collections with Zod Schemas

Setting up content collections in Astro with Zod schemas gives you type safety and validation for your markdown content—catching errors at build time instead of runtime.

## The Setup

Content collections in Astro 5 use `defineCollection` with Zod schemas:

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const tilCollection = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.date(),
      tags: z.array(z.string()),
      description: z.string(),
      draft: z.boolean().optional(),
      image: image().optional(),
    }),
});

export const collections = {
  til: tilCollection,
};
```

## Type Inference for Free

The Zod schema automatically infers TypeScript types. In your components:

```typescript
import { getCollection } from 'astro:content';

const entries = await getCollection('til');
// entries is fully typed with title, date, tags, etc.

entries.forEach(entry => {
  console.log(entry.data.title); // TypeScript knows this is a string
  console.log(entry.data.date); // TypeScript knows this is a Date
});
```

## Image Optimization

The `image()` helper from Astro enables automatic image optimization:

```typescript
schema: ({ image }) =>
  z.object({
    heroImage: image().optional(),
  }),
```

Images referenced in frontmatter get processed by Astro's image optimization pipeline automatically.

## Shared Schema Definitions

For reusable metadata across collections, extract common patterns:

```typescript
const metadataDefinition = () =>
  z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      openGraph: z
        .object({
          url: z.string().optional(),
          images: z.array(z.object({ url: z.string() })).optional(),
        })
        .optional(),
    })
    .optional();

const postCollection = defineCollection({
  schema: () =>
    z.object({
      title: z.string(),
      metadata: metadataDefinition(),
    }),
});
```

## Key Insight

Content collections transform your markdown files into a type-safe data layer. Build errors catch typos in frontmatter fields, missing required properties, and type mismatches. The DX improvement is significant—you get autocomplete and type checking everywhere you use content.
