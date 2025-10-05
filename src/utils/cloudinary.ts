import { getCldImageUrl, getCldOgImageUrl } from 'astro-cloudinary/helpers';
import { v2 as cloudinary } from 'cloudinary';

// Environment variables with validation
const CLOUDINARY_CLOUD_NAME = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = import.meta.env.PUBLIC_CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = import.meta.env.CLOUDINARY_API_SECRET;

if (!CLOUDINARY_CLOUD_NAME) {
  throw new Error('PUBLIC_CLOUDINARY_CLOUD_NAME environment variable is required');
}

// Image transformation presets for different use cases
export const CLOUDINARY_PRESETS = {
  // Portfolio gallery images
  portfolio: {
    width: 800,
    height: 600,
    crop: 'fill' as const,
    gravity: 'auto' as const,
    quality: 'auto' as const,
    format: 'auto' as const,
  },
  // Thumbnail images for cards
  thumbnail: {
    width: 400,
    height: 300,
    crop: 'fill' as const,
    gravity: 'auto' as const,
    quality: 'auto' as const,
    format: 'auto' as const,
  },
  // Hero/banner images
  hero: {
    width: 1920,
    height: 1080,
    crop: 'fill' as const,
    gravity: 'auto' as const,
    quality: 'auto' as const,
    format: 'auto' as const,
  },
  // Profile/portrait images
  portrait: {
    width: 400,
    height: 400,
    crop: 'fill' as const,
    gravity: 'face' as const,
    quality: 'auto' as const,
    format: 'auto' as const,
  },
  // Responsive images with multiple sizes
  responsive: {
    crop: 'fill' as const,
    gravity: 'auto' as const,
    quality: 'auto' as const,
    format: 'auto' as const,
  },
} as const;

// Responsive breakpoints for different screen sizes
export const RESPONSIVE_BREAKPOINTS = [320, 640, 768, 1024, 1280, 1600] as const;

// Image categories mapping to Cloudinary folders
export const IMAGE_CATEGORIES = {
  landscape: 'landscape',
  portrait: 'portrait',
  boudoir: 'boudoir',
  maternity: 'maternity',
  children: 'children',
  general: 'general',
} as const;

export type PresetName = keyof typeof CLOUDINARY_PRESETS;
export type ImageCategory = keyof typeof IMAGE_CATEGORIES;

// Interface for image data
export interface ImageData {
  filename: string;
  alt: string;
  title: string;
}

// Interface for Cloudinary search result resource
interface CloudinaryResource {
  public_id: string;
  filename?: string;
  format: string;
  resource_type: string;
  type: string;
  created_at: string;
  bytes: number;
  width: number;
  height: number;
  url: string;
  secure_url: string;
}

// Interface for processed image with URLs
export interface ProcessedImage {
  publicId: string;
  src: string;
  alt: string;
  title: string;
  thumbnail: string;
  responsive: Array<{ width: number; url: string }>;
}

/**
 * Generate a Cloudinary image URL with optimizations
 */
export function getCloudinaryImageUrl(
  publicId: string,
  options: {
    preset?: PresetName;
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'crop';
    gravity?: 'auto' | 'face' | 'center';
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
): string {
  const { preset, ...customOptions } = options;

  // Start with preset if provided
  const baseOptions = preset ? { ...CLOUDINARY_PRESETS[preset] } : {};

  // Merge with custom options (custom options override preset)
  const finalOptions = { ...baseOptions, ...customOptions };

  try {
    return getCldImageUrl({
      src: publicId,
      ...finalOptions,
    });
  } catch (error) {
    console.error('Error generating Cloudinary URL:', error);
    // Return a fallback URL
    return `https://via.placeholder.com/${finalOptions.width || 400}x${finalOptions.height || 300}?text=Image+Error`;
  }
}

/**
 * Generate responsive image URLs for different breakpoints
 */
export function getResponsiveImageUrls(
  publicId: string,
  options: {
    preset?: PresetName;
    aspectRatio?: string;
    crop?: 'fill' | 'fit' | 'scale' | 'crop';
    gravity?: 'auto' | 'face' | 'center';
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
): Array<{ width: number; url: string }> {
  const { preset = 'responsive', aspectRatio, ...baseOptions } = options;

  return RESPONSIVE_BREAKPOINTS.map(width => {
    let height: number | undefined = undefined;

    if (aspectRatio) {
      // Parse aspect ratio string like "4:3", "4/3", "16:9", etc.
      const aspectRatioStr = aspectRatio.trim();
      const separator = aspectRatioStr.includes(':') ? ':' : '/';
      const parts = aspectRatioStr.split(separator);

      if (parts.length === 2) {
        const widthRatio = Number(parts[0].trim());
        const heightRatio = Number(parts[1].trim());

        // Check if both numbers are valid
        if (!isNaN(widthRatio) && !isNaN(heightRatio) && widthRatio > 0 && heightRatio > 0) {
          height = Math.round(width * (heightRatio / widthRatio));
        }
      }
    }

    return {
      width,
      url: getCloudinaryImageUrl(publicId, {
        preset,
        width,
        height,
        ...baseOptions,
      }),
    };
  });
}

/**
 * Generate image URLs for a specific category by searching Cloudinary folder
 */
export async function getCategoryImages(category: ImageCategory, count: number = 8): Promise<ProcessedImage[]> {
  const categoryFolder = IMAGE_CATEGORIES[category];

  try {
    // Configure Cloudinary if not already configured
    if (!cloudinary.config().cloud_name) {
      cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
      });
    }

    // Search for images in the specified folder
    const searchResult = await cloudinary.search
      .expression(`resource_type:image AND asset_folder:${categoryFolder}`)
      .sort_by('public_id', 'asc')
      .max_results(count)
      .execute();

    // If no images found in the folder, return sample data
    if (!searchResult.resources || searchResult.resources.length === 0) {
      console.warn(`No images found in Cloudinary folder: ${categoryFolder}`);
      return generateFallbackImages(category, count);
    }

    // Process found images
    return searchResult.resources.map((resource: CloudinaryResource) => {
      const publicId = resource.public_id;
      const filename = resource.filename || publicId.split('/').pop() || 'image';

      return {
        publicId,
        src: getCloudinaryImageUrl(publicId, { preset: 'portfolio' }),
        alt: `${category} photography - ${filename}`,
        title: filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        thumbnail: getCloudinaryImageUrl(publicId, { preset: 'thumbnail' }),
        responsive: getResponsiveImageUrls(publicId, {
          preset: 'responsive',
          aspectRatio: '4:3',
        }),
      };
    });
  } catch (error) {
    console.error(`Error fetching images from Cloudinary for category ${category}:`, error);
    // Return fallback images if search fails
    return generateFallbackImages(category, count);
  }
}

/**
 * Generate fallback images when Cloudinary search fails or returns no results
 */
function generateFallbackImages(category: ImageCategory, count: number): ProcessedImage[] {
  const categoryFolder = IMAGE_CATEGORIES[category];

  return Array.from({ length: count }, (_, index) => {
    const imageNumber = index + 1;
    const publicId = `${categoryFolder}/sample-${imageNumber}`;

    return {
      publicId,
      src: getCloudinaryImageUrl(publicId, { preset: 'portfolio' }),
      alt: `${category} photography sample ${imageNumber}`,
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} Sample ${imageNumber}`,
      thumbnail: getCloudinaryImageUrl(publicId, { preset: 'thumbnail' }),
      responsive: getResponsiveImageUrls(publicId, {
        preset: 'responsive',
        aspectRatio: '4:3',
      }),
    };
  });
}

/**
 * Generate OG image URL for social media sharing
 */
export function getOgImageUrl(title: string, subtitle?: string, backgroundImage?: string): string {
  try {
    return getCldOgImageUrl({
      src: backgroundImage || 'og-background',
      overlays: [
        {
          text: {
            text: title,
            fontFamily: 'Inter',
            fontSize: 60,
            fontWeight: 'bold',
            color: 'white',
          },
          position: {
            gravity: 'north',
            y: 100,
          },
        },
        ...(subtitle
          ? [
              {
                text: {
                  text: subtitle,
                  fontFamily: 'Inter',
                  fontSize: 40,
                  color: 'white',
                },
                position: {
                  gravity: 'center',
                  y: 50,
                },
              },
            ]
          : []),
      ],
      width: 1200,
      height: 630,
      format: 'jpg',
      quality: 'auto',
    });
  } catch (error) {
    console.error('Error generating OG image URL:', error);
    return '';
  }
}

/**
 * Transform legacy image URLs to Cloudinary URLs
 * Useful for migrating from other image services
 */
export function transformLegacyImageUrl(
  legacyUrl: string,
  options: {
    preset?: PresetName;
    width?: number;
    height?: number;
  } = {}
): string {
  // Extract filename from legacy URL
  const filename = legacyUrl.split('/').pop()?.split('?')[0] || 'fallback';
  const publicId = `migrated/${filename}`;

  return getCloudinaryImageUrl(publicId, options);
}

/**
 * Validate Cloudinary configuration
 */
export function validateCloudinaryConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!CLOUDINARY_CLOUD_NAME) {
    errors.push('PUBLIC_CLOUDINARY_CLOUD_NAME is required');
  }

  if (!CLOUDINARY_API_KEY) {
    warnings.push('PUBLIC_CLOUDINARY_API_KEY is not set (required for upload functionality)');
  }

  if (!CLOUDINARY_API_SECRET) {
    warnings.push('CLOUDINARY_API_SECRET is not set (required for server-side operations)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Export configuration for use in other modules
export const cloudinaryConfig = {
  cloudName: CLOUDINARY_CLOUD_NAME,
  apiKey: CLOUDINARY_API_KEY,
  apiSecret: CLOUDINARY_API_SECRET,
};
