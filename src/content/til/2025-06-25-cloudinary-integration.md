---
title: 'Dynamic Image Optimization with Cloudinary'
date: 2025-06-25
tags: ['cloudinary', 'images', 'optimization', 'cdn']
description: 'Today I learned how Cloudinary can transform and optimize images on-the-fly, reducing the need for pre-processing.'
draft: false
---

# Dynamic Image Optimization with Cloudinary

Managing images for a website means dealing with multiple sizes, formats, and quality levels. Today I integrated Cloudinary for dynamic image transformation.

## Why Not Just Use Astro's Image Optimization?

Astro's built-in image optimization is great for static images, but Cloudinary excels when you need:

- Dynamic transformations based on context
- Images from external sources (like Notion)
- Real-time cropping, resizing, and effects
- Automatic format selection (WebP, AVIF)

## Implementation

```typescript
// src/lib/cloudinary.ts
import { Cloudinary } from '@cloudinary/url-gen';

const cld = new Cloudinary({
  cloud: { cloudName: process.env.CLOUDINARY_CLOUD_NAME },
});

export function getOptimizedUrl(publicId: string, width: number) {
  return cld.image(publicId).format('auto').quality('auto').resize(fill().width(width)).toURL();
}
```

## In Components

```astro
---
import { getOptimizedUrl } from '@/lib/cloudinary';
const heroUrl = getOptimizedUrl('hero-image', 1200);
---

<img src={heroUrl} alt="Hero" loading="lazy" />
```

## Key Insight

The URL-based transformation API means you can request exactly what you need. A 400px thumbnail? Change the URL parameter. Need a blurred placeholder? Add `e_blur:1000`. No build-time processing, just instant transformations at the CDN edge.
