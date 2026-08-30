---
title: 'Adding Lightning-Fast Search with Pagefind'
date: 2025-05-18
tags: ['astro', 'search', 'pagefind', 'static-site']
description: 'Today I learned how Pagefind provides instant client-side search for static sites without any backend infrastructure.'
draft: false
---

# Adding Lightning-Fast Search with Pagefind

Static sites traditionally struggle with search—you either need a backend service or rely on external providers. Today I integrated Pagefind, and it's a game-changer.

## What Makes Pagefind Special

Pagefind builds a search index at build time and includes a tiny client-side search that:

- Works entirely client-side (no server needed)
- Has a compressed index averaging ~100kB for most sites
- Provides instant results with typo tolerance
- Supports multiple languages

## Integration in Astro

```bash
pnpm add pagefind
```

Then in your build script:

```json
{
  "scripts": {
    "postbuild": "pagefind --site dist"
  }
}
```

And in your search component:

```astro
<div id="search"></div>
<script>
  import * as pagefind from '/pagefind/pagefind.js';
  pagefind.init();
  new PagefindUI({ element: '#search' });
</script>
```

## Key Insight

The search index is built at deploy time, so it's always in sync with your content. No more worrying about stale search results or webhook failures. When your site builds, your search is automatically updated.

Perfect for content-heavy static sites where you want great search UX without operational complexity.
