// Recursive sanitizer alternative to the visit-based normalizer.
// Toggle via environment variable: NOTION_SANITIZER_MODE=recursive
// This ensures every node has a children array and normalizes key attributes
// before any other rehype plugin runs.

export function rehypeSanitizeRecursive() {
  return function (tree: any) {
    sanitizeNode(tree);
  };
}

function sanitizeNode(node: any): void {
  if (!node || typeof node !== 'object') return;

  // Ensure children is always an array of objects
  if (!Array.isArray((node as any).children)) {
    (node as any).children = [];
  } else {
    (node as any).children = (node as any).children.filter((c: any) => c && typeof c === 'object');
  }

  // Normalize element properties
  if ((node as any).type === 'element') {
    const el: any = node;
    if (!el.properties || typeof el.properties !== 'object') {
      el.properties = {};
    }

    const cls = el.properties.className;
    if (typeof cls === 'string') {
      el.properties.className = [cls];
    }

    if (el.tagName === 'a') {
      const href = el.properties.href;
      if (href && typeof href !== 'string') {
        try {
          el.properties.href = String((href as any).url ?? href);
        } catch {
          delete el.properties.href;
        }
      }
    }

    if (el.tagName === 'img') {
      const src = el.properties.src;
      if (src && typeof src !== 'string') {
        try {
          el.properties.src = String((src as any).url ?? src);
        } catch {
          delete el.properties.src;
        }
      }
    }
  }

  // Recurse on children
  for (const child of (node as any).children) {
    sanitizeNode(child);
  }
}


