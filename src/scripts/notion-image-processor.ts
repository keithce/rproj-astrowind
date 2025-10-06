/**
 * Client-side script to process Notion images with __ASTRO_IMAGE_ attributes
 * This script runs after page load to convert tagged images to optimized Astro images
 */

interface AstroImageData {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  index: number;
}

function processNotionImages() {
  const images = document.querySelectorAll('img[__ASTRO_IMAGE_]');

  images.forEach(img => {
    try {
      const astroImageData = JSON.parse(img.getAttribute('__ASTRO_IMAGE_') || '{}') as AstroImageData;

      if (astroImageData.src) {
        // Create a new optimized image element
        const optimizedImg = document.createElement('img');

        // Copy all existing attributes except __ASTRO_IMAGE_
        Array.from(img.attributes).forEach(attr => {
          if (attr.name !== '__ASTRO_IMAGE_') {
            optimizedImg.setAttribute(attr.name, attr.value);
          }
        });

        // Set the optimized src
        optimizedImg.src = astroImageData.src;

        // Add responsive attributes if available
        if (astroImageData.width) {
          optimizedImg.width = astroImageData.width;
        }
        if (astroImageData.height) {
          optimizedImg.height = astroImageData.height;
        }

        // Add loading optimization
        optimizedImg.loading = 'lazy';
        optimizedImg.decoding = 'async';

        // Replace the original image
        img.parentNode?.replaceChild(optimizedImg, img);
      }
    } catch (error) {
      console.warn('Failed to process Notion image:', error);
    }
  });
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', processNotionImages);
} else {
  processNotionImages();
}

// Also run on page navigation (for SPA-like behavior)
document.addEventListener('astro:page-load', processNotionImages);
