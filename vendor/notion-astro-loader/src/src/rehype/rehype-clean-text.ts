import { visitParents } from 'unist-util-visit-parents';

// Clean up common escaping artifacts in text nodes and normalize <a href> URLs.
// - Decodes anchor hrefs with decodeURI
// - Removes stray backslashes that precede punctuation/symbols in visible text
//   outside of <code>/<pre> blocks
export function rehypeCleanText() {
  return function (tree: any) {
    visitParents(tree, (node: any, ancestors: any[]) => {
      if (!node || typeof node !== 'object') return;

      // Normalize anchor hrefs
      if (node.type === 'element' && node.tagName === 'a' && node.properties?.href) {
        try {
          node.properties.href = decodeURI(String(node.properties.href));
        } catch {}
      }

      // Clean text nodes not inside <code> or <pre>
      if (node.type === 'text' && typeof node.value === 'string') {
        const inCode = ancestors.some(
          (a) => a?.type === 'element' && (a.tagName === 'code' || a.tagName === 'pre')
        );
        if (!inCode) {
          // Remove a single escaping backslash before common punctuation/symbols
          node.value = node.value.replace(/\\([()\[\]{}'";:,.!?|`~<>#\-])/g, '$1');
          // Collapse doubled spaces introduced during transformations
          node.value = node.value.replace(/\s{2,}/g, ' ');
        }
      }
    });
  };
}