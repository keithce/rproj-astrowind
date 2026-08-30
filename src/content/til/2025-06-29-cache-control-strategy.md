---
title: 'Fine-Tuning Cache-Control Headers for Astro Sites'
date: 2025-06-29
tags: ['caching', 'performance', 'vercel', 'http-headers']
description: 'Today I learned how to configure Cache-Control headers strategically to balance performance with content freshness.'
draft: false
---

# Fine-Tuning Cache-Control Headers for Astro Sites

Not all content should be cached the same way. Today I implemented a nuanced caching strategy.

## The Problem

Default caching often means:

- Static assets cached forever (good)
- Dynamic pages not cached at all (sometimes too aggressive)
- API routes returning stale data (bad)

## Strategic Cache Headers

```json
// vercel.json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "no-store, must-revalidate" }]
    },
    {
      "source": "/_astro/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800" }
      ]
    }
  ]
}
```

## What This Achieves

1. **API routes**: Never cached, always fresh
2. **Static assets** (`/_astro/`): Cached for one year (immutable with content hashes)
3. **HTML pages**: CDN caches for 1 day, serves stale while revalidating for up to 1 week

## Key Insight

`stale-while-revalidate` is the secret sauce. Users get instant responses from cache while the CDN fetches fresh content in the background. Best of both worlds: speed AND freshness.
