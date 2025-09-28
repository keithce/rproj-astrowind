# Cloudinary Integration Setup Guide

## Overview

This project integrates with Cloudinary for optimized image delivery, automatic format conversion, and responsive image generation. The integration replaces static image sources with dynamic Cloudinary URLs for better performance and optimization.

## Environment Variables Setup

Add these environment variables to your `.env` file:

```bash
# Required: Your Cloudinary cloud name (public)
PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here

# Optional: API key for upload functionality (public)
PUBLIC_CLOUDINARY_API_KEY=your_api_key_here

# Optional: API secret for server-side operations (private)
CLOUDINARY_API_SECRET=your_api_secret_here
```

### Getting Your Cloudinary Credentials

1. Sign up for a free account at [Cloudinary](https://cloudinary.com)
2. Go to your [Dashboard](https://cloudinary.com/console)
3. Copy your Cloud Name, API Key, and API Secret
4. Add them to your environment variables

**Note**: Only `PUBLIC_CLOUDINARY_CLOUD_NAME` is required for basic image delivery. The API credentials are needed for uploads and advanced server-side operations.

## Image Organization in Cloudinary

The integration expects images to be organized in the following folder structure:

```
portfolio/
├── landscape/
│   ├── mountain-sunset-vista
│   ├── ocean-waves-coast
│   └── ...
├── portrait/
│   ├── business-headshot
│   ├── artistic-portrait
│   └── ...
├── boudoir/
│   ├── elegant-silhouette
│   ├── vintage-style
│   └── ...
└── maternity-children/
    ├── pregnancy-glow
    ├── newborn-peaceful
    └── ...
```

## Available Presets

The integration includes several optimization presets:

### Portfolio Preset

- **Size**: 800x600px
- **Crop**: Fill
- **Quality**: Auto
- **Format**: Auto (WebP when supported)

### Thumbnail Preset

- **Size**: 400x300px
- **Crop**: Fill
- **Quality**: Auto
- **Format**: Auto

### Hero Preset

- **Size**: 1920x1080px
- **Crop**: Fill
- **Quality**: Auto
- **Format**: Auto

### Portrait Preset

- **Size**: 400x400px
- **Crop**: Fill with face detection
- **Quality**: Auto
- **Format**: Auto

## Usage Examples

### Basic Image URL Generation

```typescript
import { getCloudinaryImageUrl } from '~/utils/cloudinary';

// Generate a portfolio image URL
const imageUrl = getCloudinaryImageUrl('portfolio/landscape/mountain-sunset-vista', {
  preset: 'portfolio',
});

// Generate a custom sized image
const customUrl = getCloudinaryImageUrl('portfolio/portrait/business-headshot', {
  width: 600,
  height: 400,
  crop: 'fill',
  gravity: 'face',
});
```

### Responsive Images

```typescript
import { getResponsiveImageUrls } from '~/utils/cloudinary';

// Generate responsive URLs for different screen sizes
const responsiveUrls = getResponsiveImageUrls('portfolio/landscape/mountain-sunset-vista', {
  preset: 'responsive',
  aspectRatio: '16:9',
});

// Returns array of { width: number, url: string }
```

### Category Images

```typescript
import { getCategoryImages } from '~/utils/cloudinary';

// Get 8 images from the landscape category
const landscapeImages = getCategoryImages('landscape', 8);

// Returns ProcessedImage[] with src, thumbnail, and responsive URLs
```

## Automatic Optimizations

All images automatically include:

- **Format Optimization**: Automatic WebP delivery when supported
- **Quality Optimization**: Intelligent quality adjustment based on content
- **Compression**: Lossless compression for smaller file sizes
- **Responsive Delivery**: Multiple sizes for different screen resolutions

## Migration from Static Images

The utility includes a helper for migrating from existing image services:

```typescript
import { transformLegacyImageUrl } from '~/utils/cloudinary';

// Transform an Unsplash URL to Cloudinary
const cloudinaryUrl = transformLegacyImageUrl('https://images.unsplash.com/photo-1506905925346-21bda4d32df4', {
  preset: 'portfolio',
});
```

## Configuration Validation

Check if your Cloudinary setup is correct:

```typescript
import { validateCloudinaryConfig } from '~/utils/cloudinary';

const validation = validateCloudinaryConfig();
if (!validation.isValid) {
  console.error('Cloudinary configuration errors:', validation.errors);
}
```

## Best Practices

### Image Naming

- Use descriptive, SEO-friendly filenames
- Use hyphens instead of spaces
- Include category context in the filename

### Folder Organization

- Keep images organized by category
- Use consistent naming conventions
- Consider using subfolders for large collections

### Performance

- Use appropriate presets for different use cases
- Leverage responsive images for mobile optimization
- Consider lazy loading for below-the-fold images

### SEO

- Always provide meaningful alt text
- Use descriptive filenames
- Optimize for Core Web Vitals

## Troubleshooting

### Common Issues

1. **Images not loading**: Check environment variables are set correctly
2. **404 errors**: Verify image paths match Cloudinary folder structure
3. **Slow loading**: Ensure you're using appropriate presets and formats

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=cloudinary
```

This will log URL generation and any errors to the console.

## Integration with Astro Config

Update your `astro.config.ts` to include Cloudinary domains:

```typescript
export default defineConfig({
  image: {
    domains: ['res.cloudinary.com', 'cdn.pixabay.com', 'images.unsplash.com', 'images.pexels.com'],
    // ... other config
  },
  // ... rest of config
});
```

## Sample Data

The integration includes sample image data for development and testing. In production, replace the `generateSampleImageData` function with your actual CMS or database integration.

## Support

For issues with the Cloudinary integration:

1. Check the [Cloudinary Documentation](https://cloudinary.com/documentation)
2. Verify environment variables are set correctly
3. Check browser console for error messages
4. Ensure images exist in your Cloudinary account
