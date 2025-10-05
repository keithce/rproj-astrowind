// Clean up common escaping artifacts in text nodes and normalize <a href> URLs.
// Implemented with a manual traversal to avoid visitor assumptions about children.
export function rehypeCleanText() {
  return function (tree: any) {
    type StackItem = { node: any; inCode: boolean };
    const stack: StackItem[] = [];
    if (tree && typeof tree === 'object') {
      stack.push({ node: tree, inCode: false });
    }

    while (stack.length > 0) {
      const { node, inCode } = stack.pop() as StackItem;
      if (!node || typeof node !== 'object') continue;

      const isElement = node.type === 'element';
      const tag = isElement ? node.tagName : undefined;
      const nextInCode = inCode || (isElement && (tag === 'code' || tag === 'pre'));

      // Normalize anchor hrefs - only decode safe segments to preserve query/hash params
      if (isElement && tag === 'a' && node.properties?.href) {
        try {
          const href = String(node.properties.href);
          // Only decode if it appears to be a valid URL with encoded characters
          if (href.includes('%') && (href.startsWith('http') || href.startsWith('/') || href.startsWith('#'))) {
            try {
              // Parse the URL to safely decode only the pathname
              const url = new URL(href, 'http://example.com');
              const originalPathname = url.pathname;
              const decodedPathname = decodeURIComponent(originalPathname);
              
              // Only update if decoding actually changed the pathname
              if (originalPathname !== decodedPathname) {
                // Remove the temporary base URL and reconstruct the original URL structure
                if (href.startsWith('http')) {
                  // For absolute URLs, reconstruct with original protocol/domain
                  const newUrl = new URL(href);
                  newUrl.pathname = decodedPathname;
                  node.properties.href = newUrl.href;
                } else {
                  // For relative URLs, reconstruct without the base URL
                  node.properties.href = decodedPathname + (url.search || '') + (url.hash || '');
                }
              }
            } catch {
              // If URL parsing fails, leave href as-is
            }
          }
        } catch {
          // If any processing fails, leave href as-is
        }
      }

      // Clean visible text
      if (node.type === 'text' && typeof node.value === 'string' && !nextInCode) {
        node.value = node.value.replace(/\\([()\[\]{}'";:,.!?|`~<>#\-])/g, '$1');
        node.value = node.value.replace(/\s{2,}/g, ' ');
      }

      const children = Array.isArray(node.children) ? node.children : [];
      for (const child of children) {
        if (child && typeof child === 'object') {
          stack.push({ node: child, inCode: Boolean(nextInCode) });
        }
      }
    }
  };
}