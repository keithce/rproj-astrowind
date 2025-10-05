import { visit } from 'unist-util-visit';

export function rehypeNormalize() {
  return function (tree: any) {
    visit(tree, (node: any) => {
      // Guard against parent walk assuming children; ensure structure exists
      if (!node || typeof node !== 'object') return;
      if ((node as any).type === 'root' && !Array.isArray((node as any).children)) {
        (node as any).children = [];
      }
      if (node && node.type === 'element') {
        if (!node.properties || typeof node.properties !== 'object') {
          node.properties = {};
        }

        // Normalize className to array per HAST convention
        const cls = (node.properties as any).className;
        if (typeof cls === 'string') {
          (node.properties as any).className = [cls];
        }

        // Normalize common attributes to strings
        if (node.tagName === 'a') {
          const href = (node.properties as any).href;
          if (href && typeof href !== 'string') {
            try {
              (node.properties as any).href = String((href as any).url ?? href);
            } catch {
              delete (node.properties as any).href;
            }
          }
        }

        if (node.tagName === 'img') {
          const src = (node.properties as any).src;
          if (src && typeof src !== 'string') {
            try {
              (node.properties as any).src = String((src as any).url ?? src);
            } catch {
              delete (node.properties as any).src;
            }
          }
        }
      }

      // Clean invalid children arrays to avoid undefined entries propagating
      const children = (node as any)?.children;
      if (!Array.isArray(children)) {
        (node as any).children = [];
      } else {
        (node as any).children = children.filter((c: any) => c && typeof c === 'object');
      }
    });
  };
}


