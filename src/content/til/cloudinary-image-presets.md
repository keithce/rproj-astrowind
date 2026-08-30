---
title: 'Cloudinary Image Optimization with Presets'
date: 2025-01-02
tags: ['cloudinary', 'images', 'performance', 'typescript']
description: 'Today I learned how to build a type-safe Cloudinary utility layer with presets for consistent image optimization across a photography portfolio.'
draft: false
---

# Cloudinary Image Optimization with Presets

Managing a photography portfolio means dozens of images at different sizes. Cloudinary's transformation API handles optimization, but without structure it gets messy fast. The solution: a preset-based utility layer.

## Preset Definition

Define reusable transformation presets:

```typescript
// src/utils/cloudinary.ts
type Preset = 'portfolio' | 'thumbnail' | 'hero' | 'portrait' | 'responsive';

const presets: Record<Preset, CloudinaryTransformOptions> = {
  portfolio: { width: 800, height: 600, crop: 'fill', quality: 'auto' },
  thumbnail: { width: 400, height: 300, crop: 'fill', quality: 'auto' },
  hero: { width: 1920, height: 1080, crop: 'fill', quality: 'auto' },
  portrait: { width: 400, height: 400, crop: 'face', gravity: 'face' },
  responsive: { width: 'auto', crop: 'scale', quality: 'auto', format: 'auto' },
};
```

## URL Generation

Transform presets into Cloudinary URLs:

```typescript
export function getCloudinaryImageUrl(publicId: string, options: { preset: Preset; aspectRatio?: string }): string {
  const { preset, aspectRatio } = options;
  const transforms = presets[preset];

  const parts = [
    `f_auto`,
    `q_${transforms.quality || 'auto'}`,
    transforms.width && `w_${transforms.width}`,
    transforms.height && `h_${transforms.height}`,
    transforms.crop && `c_${transforms.crop}`,
    transforms.gravity && `g_${transforms.gravity}`,
    aspectRatio && `ar_${aspectRatio}`,
  ].filter(Boolean);

  return `https://res.cloudinary.com/${cloudName}/image/upload/${parts.join(',')}/${publicId}`;
}
```

## Responsive Image Sets

Generate srcset for responsive images:

```typescript
export function getResponsiveImageUrls(publicId: string): ResponsiveUrls {
  const widths = [320, 640, 768, 1024, 1280, 1536];

  return {
    srcSet: widths.map(w => `${getCloudinaryUrl(publicId, { width: w })} ${w}w`).join(', '),
    sizes: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
  };
}
```

## Environment Validation

Fail fast when Cloudinary isn't configured:

```typescript
export function validateCloudinaryConfig(): void {
  if (!import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME) {
    throw new Error('PUBLIC_CLOUDINARY_CLOUD_NAME is required');
  }
}
```

## Key Insight

Cloudinary's automatic format (`f_auto`) and quality (`q_auto`) transformations reduce image sizes by 25-35% without visible quality loss. The preset pattern keeps transformations consistent and makes updates easy—change one preset, update every image using it.
