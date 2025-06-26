# Dynamic Cloudinary Image Loading

## Overview

The `getCategoryImages()` function has been enhanced to dynamically find and load all images from specified Cloudinary folders using the Cloudinary Search API. This eliminates the need for hardcoded image lists and automatically discovers new images as they're uploaded to your Cloudinary account.

## How It Works

### 1. Dynamic Image Discovery

The function now uses Cloudinary's Search API to:

- Search for all images in a specific folder
- Sort them by public ID
- Limit results to the requested count
- Return properly formatted image data with optimized URLs

### 2. Fallback System

If the search fails or no images are found:

- Generates sample/placeholder images
- Logs warnings for debugging
- Ensures the application continues to work

### 3. Folder Structure

Images are organized in Cloudinary folders based on categories:

```
cloudinary-root/
├── landscape/          # Landscape photography
├── portrait/           # Portrait photography
├── boudoir/           # Boudoir photography
├── maternity/         # Maternity photography
├── children/          # Children photography
└── general/           # General/misc photography
```

## Usage

### Basic Usage

```typescript
// In Astro component frontmatter
const landscapeImages = await getCategoryImages('landscape', 8);
const portraitImages = await getCategoryImages('portrait', 6);
```

### Function Signature

```typescript
async function getCategoryImages(category: ImageCategory, count: number = 8): Promise<ProcessedImage[]>;
```

**Parameters:**

- `category`: One of 'landscape', 'portrait', 'boudoir', 'maternity', 'children', 'general'
- `count`: Maximum number of images to return (default: 8)

**Returns:**

- Array of `ProcessedImage` objects with optimized URLs

### ProcessedImage Interface

```typescript
interface ProcessedImage {
  src: string; // Main optimized image URL
  alt: string; // Alt text for accessibility
  title: string; // Image title
  thumbnail: string; // Thumbnail URL
  responsive: Array<{ width: number; url: string }>; // Responsive image URLs
}
```

## Configuration Requirements

### Environment Variables

```bash
# Required for search functionality
PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
PUBLIC_CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Cloudinary Setup

1. **Upload Images to Folders**

   ```bash
   # Example folder structure in Cloudinary
   /landscape/sunset-beach.jpg
   /landscape/mountain-vista.jpg
   /portrait/headshot-01.jpg
   /portrait/couple-session.jpg
   ```

2. **Asset Folder Structure**
   - Use the folder names defined in `IMAGE_CATEGORIES`
   - Upload images directly to these folders
   - Images will be automatically discovered

## Search API Details

### Search Expression

The function uses this Cloudinary search expression:

```javascript
`resource_type:image AND asset_folder:${categoryFolder}`;
```

This finds:

- All resources of type "image"
- Located in the specified asset folder
- Sorted by public_id in ascending order

### Search Options

- **Max Results**: Limited by the `count` parameter
- **Sorting**: By public_id (alphabetical)
- **Resource Type**: Images only
- **Folder Filtering**: Exact folder match

## Error Handling

### Search Failures

If the Cloudinary search fails:

1. Error is logged to console
2. Fallback images are generated
3. Application continues to function

### No Images Found

If a folder is empty:

1. Warning is logged
2. Sample placeholder images are created
3. User sees consistent layout

### Fallback Images

Generated with this pattern:

```
/{category}/sample-1
/{category}/sample-2
...
```

## Performance Considerations

### Caching

- Cloudinary automatically caches search results
- Consider implementing application-level caching for production
- Search API has rate limits (check your Cloudinary plan)

### Optimization

- Images are automatically optimized with `f_auto` and `q_auto`
- Multiple preset sizes are generated
- Responsive images created for different breakpoints

## Migration from Static Images

### Before (Static)

```typescript
const landscapeImages = [
  { src: 'landscape/image1.jpg', alt: 'Sunset', title: 'Beautiful Sunset' },
  { src: 'landscape/image2.jpg', alt: 'Mountain', title: 'Mountain Vista' },
];
```

### After (Dynamic)

```typescript
// Automatically finds all images in the landscape folder
const landscapeImages = await getCategoryImages('landscape', 8);
```

## Best Practices

### 1. Folder Organization

- Use consistent folder naming
- Keep folders organized by category
- Use descriptive filenames

### 2. Image Naming

- Use descriptive filenames (they become titles)
- Avoid special characters
- Use hyphens or underscores for spaces

### 3. Error Monitoring

- Monitor console for search warnings
- Set up Cloudinary webhook notifications
- Track API usage and limits

### 4. Performance

- Consider caching search results
- Monitor API usage
- Use appropriate image counts per category

## Troubleshooting

### Common Issues

1. **No Images Found**

   - Check folder names match `IMAGE_CATEGORIES`
   - Verify images are uploaded to correct folders
   - Check Cloudinary dashboard

2. **Search API Errors**

   - Verify API credentials are correct
   - Check API key permissions
   - Monitor rate limits

3. **Slow Loading**
   - Reduce image count per category
   - Implement caching
   - Check network connectivity

### Debug Mode

Enable debug logging:

```typescript
// Add to your component
console.log('Category images loaded:', landscapeImages.length);
```

## Future Enhancements

### Potential Improvements

1. **Metadata Integration**

   - Use Cloudinary tags for categorization
   - Extract EXIF data for image information
   - Implement custom metadata fields

2. **Advanced Filtering**

   - Filter by upload date
   - Filter by image dimensions
   - Filter by tags or metadata

3. **Caching Layer**

   - Implement Redis caching
   - Add cache invalidation
   - Background refresh of image lists

4. **Real-time Updates**
   - Webhook integration for new uploads
   - Automatic cache invalidation
   - Live preview updates

## API Reference

### getCategoryImages()

```typescript
/**
 * Generate image URLs for a specific category by searching Cloudinary folder
 * @param category - Image category matching folder structure
 * @param count - Maximum number of images to return
 * @returns Promise<ProcessedImage[]> - Array of processed images with URLs
 */
export async function getCategoryImages(category: ImageCategory, count: number = 8): Promise<ProcessedImage[]>;
```

### generateFallbackImages()

```typescript
/**
 * Generate fallback images when Cloudinary search fails
 * @param category - Image category for naming
 * @param count - Number of fallback images to generate
 * @returns ProcessedImage[] - Array of fallback images
 */
function generateFallbackImages(category: ImageCategory, count: number): ProcessedImage[];
```

## Support

For issues or questions:

1. Check Cloudinary dashboard for folder structure
2. Verify environment variables are set
3. Monitor console for error messages
4. Check network connectivity to Cloudinary API

---

_This documentation covers the dynamic image loading system. For general Cloudinary integration, see `cloudinary-integration-summary.md`._
