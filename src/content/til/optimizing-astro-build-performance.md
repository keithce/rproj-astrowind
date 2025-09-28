---
title: 'Optimizing Astro Build Performance'
date: 2025-06-18
tags: ['astro', 'performance', 'build']
description: 'Today I learned several techniques to significantly improve build times in larger Astro projects.'
draft: false
---

# Optimizing Astro Build Performance

Working on a large Astro project today, I discovered several techniques to significantly improve build performance.

## 1. Content Collections Over File Globbing

Using Astro's content collections provides better build performance compared to using `Astro.glob()` directly:

```typescript
// Less efficient
const posts = await Astro.glob('../content/blog/*.md');

// More efficient
import { getCollection } from 'astro:content';
const posts = await getCollection('blog');
```

Content collections are pre-processed at build time, resulting in faster builds and better type safety.

## 2. Image Optimization Strategy

Astro's image optimization is powerful but can slow down builds with many images. Some strategies I found effective:

- Use the `inferSize` option when dimensions are in the image metadata
- Implement dimension caching for frequently used images
- For truly static images, pre-optimize and place in `public/` instead

## 3. Partial Hydration Management

I realized that over-hydrating components with `client:load` can not only affect runtime performance but also build times. Being more selective with hydration directives improved build speed:

```astro
<!-- Replace this -->
<MyComponent client:load />

<!-- With this when possible -->
<MyComponent client:visible />
<!-- Or this -->
<MyComponent client:idle />
```

## 4. Vite Configuration Tweaks

Adding these settings to `vite` in the Astro config improved build time:

```js
vite: {
  build: {
    // Reduce transform cache invalidation
    cssCodeSplit: false,
    // Increase build speed with multiple CPU cores
    minify: 'esbuild',
    // Only include required polyfills
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14']
  }
}
```

These optimizations reduced our build time from 3 minutes to just under 1 minute for a site with 200+ pages.
