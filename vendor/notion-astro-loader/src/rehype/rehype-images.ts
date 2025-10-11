import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';

interface Config {
  imagePaths?: string[];
}

export function rehypeImages(options?: Config) {
  const { imagePaths } = options || {};
  
  return function (tree: any, file: VFile) {
    const imageOccurrenceMap = new Map();

    visit(tree, (node) => {
      if (node.type !== 'element') return;
      if (node.tagName !== 'img') return;

      if (node.properties?.src) {
        node.properties.src = decodeURI(node.properties.src);
        
        if (file.data.astro) {
          // Use a typed-friendly property to avoid TS errors
          (file.data.astro as any).localImagePaths = imagePaths;
        }

        // Check if this image should be processed by Astro
        // This includes both local paths and AWS S3 URLs that have been saved locally
        const shouldProcess = imagePaths?.some(localPath => {
          // Check if the src matches a local path
          if (node.properties.src === localPath) return true;
          
          // Check if the src is an AWS S3 URL that corresponds to a local path
          // AWS URLs have format: .../pageId/fileId/filename?params
          // Local files have format: .../fileId.filename
          let isS3Host = false;
          try {
            const urlObj = new URL(node.properties.src, 'http://localhost'); // in case src is relative
            isS3Host = urlObj.hostname === 'prod-files-secure.s3.us-west-2.amazonaws.com';
          } catch (e) {
            // Malformed URL, do not set isS3Host
          }
          if (isS3Host) {
            // Extract the file ID from the AWS URL path
            // Pattern: /pageId/fileId/filename
            const awsPathMatch = node.properties.src.match(/\/[a-f0-9-]+\/([a-f0-9-]+)\/[^?]+/i);
            if (awsPathMatch) {
              const fileId = awsPathMatch[1];
              // Check if any local path contains this file ID
              if (localPath.includes(fileId)) {
                return true;
              }
            }
          }
          
          return false;
        });

        if (shouldProcess) {
          // Preserve original img props to ensure HTML rendering remains intact while tagging for Astro
          const originalProps = { ...node.properties } as Record<string, any>;

          // Initialize or increment occurrence count for this image
          const index = imageOccurrenceMap.get(node.properties.src) || 0;
          imageOccurrenceMap.set(node.properties.src, index + 1);

          // Attach metadata without stripping attributes
          node.properties['__ASTRO_IMAGE_'] = JSON.stringify({ ...originalProps, index });
        }
      }
    });
  };
}
