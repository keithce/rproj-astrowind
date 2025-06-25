import { getCldImageUrl, getCldOgImageUrl } from 'astro-cloudinary/helpers';

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
  landscape: 'portfolio/landscape',
  portrait: 'portfolio/portrait',
  boudoir: 'portfolio/boudoir',
  'maternity-children': 'portfolio/maternity-children',
  general: 'portfolio/general',
} as const;

export type PresetName = keyof typeof CLOUDINARY_PRESETS;
export type ImageCategory = keyof typeof IMAGE_CATEGORIES;

// Interface for image data
export interface ImageData {
  filename: string;
  alt: string;
  title: string;
}

// Interface for processed image with URLs
export interface ProcessedImage {
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
    const height = aspectRatio ? Math.round(width / parseFloat(aspectRatio.replace(':', '/'))) : undefined;
    
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
 * Generate sample image data for a category
 */
function generateSampleImageData(category: ImageCategory, count: number): ImageData[] {
  const sampleData: Record<ImageCategory, ImageData[]> = {
    landscape: [
      { filename: 'mountain-sunset-vista', alt: 'Golden hour mountain vista with dramatic clouds', title: 'Mountain Sunset Vista' },
      { filename: 'ocean-waves-coast', alt: 'Powerful ocean waves crashing against rocky coastline', title: 'Coastal Symphony' },
      { filename: 'forest-mist-sunbeams', alt: 'Misty forest with sunbeams filtering through trees', title: 'Enchanted Forest' },
      { filename: 'desert-dunes-sunrise', alt: 'Sand dunes with rippling patterns at sunrise', title: 'Desert Dreams' },
      { filename: 'city-skyline-twilight', alt: 'Urban skyline at twilight with city lights', title: 'Urban Twilight' },
      { filename: 'lake-mountain-reflection', alt: 'Perfect mountain reflection in crystal clear lake', title: 'Mirror Lake' },
      { filename: 'waterfall-canyon', alt: 'Cascading waterfall in lush green canyon', title: "Nature's Power" },
      { filename: 'aurora-northern-lights', alt: 'Aurora borealis dancing across starry sky', title: 'Celestial Dance' },
    ],
    portrait: [
      { filename: 'business-headshot', alt: 'Professional business headshot with confident expression', title: 'Executive Portrait' },
      { filename: 'artistic-portrait', alt: 'Creative artistic portrait with dramatic lighting', title: 'Artistic Vision' },
      { filename: 'senior-portrait', alt: 'High school senior portrait in natural setting', title: 'Senior Celebration' },
      { filename: 'couple-portrait', alt: 'Romantic couple portrait during golden hour', title: 'Love Story' },
      { filename: 'musician-portrait', alt: 'Musician portrait with instrument in studio', title: 'Artist Expression' },
      { filename: 'lifestyle-portrait', alt: 'Natural lifestyle portrait in urban environment', title: 'Urban Lifestyle' },
      { filename: 'family-portrait', alt: 'Multi-generational family portrait outdoors', title: 'Family Legacy' },
    ],
    boudoir: [
      { filename: 'elegant-silhouette', alt: 'Elegant boudoir silhouette with soft lighting', title: 'Elegant Grace' },
      { filename: 'vintage-style', alt: 'Vintage-inspired boudoir photography', title: 'Vintage Romance' },
      { filename: 'modern-artistic', alt: 'Modern artistic boudoir with creative composition', title: 'Modern Art' },
      { filename: 'natural-light', alt: 'Natural light boudoir with soft shadows', title: 'Natural Beauty' },
      { filename: 'dramatic-lighting', alt: 'Dramatic lighting creating mood and atmosphere', title: 'Dramatic Mood' },
      { filename: 'intimate-portrait', alt: 'Intimate portrait celebrating femininity', title: 'Celebration' },
    ],
    'maternity-children': [
      { filename: 'pregnancy-glow', alt: 'Beautiful maternity portrait celebrating pregnancy', title: 'Expecting Joy' },
      { filename: 'newborn-peaceful', alt: 'Peaceful sleeping newborn in soft wrapping', title: 'New Beginning' },
      { filename: 'toddler-playful', alt: 'Playful toddler portrait with genuine smile', title: 'Pure Joy' },
      { filename: 'couple-expecting', alt: 'Expecting couple in intimate maternity session', title: 'Growing Love' },
      { filename: 'siblings-bond', alt: 'Sweet sibling portrait showing their bond', title: 'Sibling Bond' },
      { filename: 'first-birthday', alt: 'First birthday celebration cake smash session', title: 'Milestone Moment' },
      { filename: 'maternity-nature', alt: 'Maternity portrait in beautiful natural setting', title: "Nature's Blessing" },
    ],
    general: [
      { filename: 'sample-1', alt: 'Sample image 1', title: 'Sample 1' },
      { filename: 'sample-2', alt: 'Sample image 2', title: 'Sample 2' },
      { filename: 'sample-3', alt: 'Sample image 3', title: 'Sample 3' },
      { filename: 'sample-4', alt: 'Sample image 4', title: 'Sample 4' },
      { filename: 'sample-5', alt: 'Sample image 5', title: 'Sample 5' },
      { filename: 'sample-6', alt: 'Sample image 6', title: 'Sample 6' },
      { filename: 'sample-7', alt: 'Sample image 7', title: 'Sample 7' },
      { filename: 'sample-8', alt: 'Sample image 8', title: 'Sample 8' },
    ],
  };

  const categoryData = sampleData[category] || sampleData.general;
  return categoryData.slice(0, count);
}

/**
 * Generate image URLs for a specific category with sample images
 */
export function getCategoryImages(
  category: ImageCategory,
  count: number = 8
): ProcessedImage[] {
  const categoryFolder = IMAGE_CATEGORIES[category];
  
  // Sample image data - in production, this would come from your CMS or database
  const sampleImages = generateSampleImageData(category, count);
  
  return sampleImages.map((image) => {
    const publicId = `${categoryFolder}/${image.filename}`;
    
    return {
      src: getCloudinaryImageUrl(publicId, { preset: 'portfolio' }),
      alt: image.alt,
      title: image.title,
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
export function getOgImageUrl(
  title: string,
  subtitle?: string,
  backgroundImage?: string
): string {
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
        ...(subtitle ? [{
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
        }] : []),
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