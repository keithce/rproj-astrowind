import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';

interface Config {
  imagePaths?: string[];
}

export function rehypeImages() {
  return ({ imagePaths }: Config) =>
    function (tree: any, file: VFile) {
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

          if (imagePaths?.includes(node.properties.src)) {
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
