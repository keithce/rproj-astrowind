import { visit } from 'unist-util-visit';

// Unescape backslash-escaped punctuation in text nodes (outside code/pre)
// This fixes artifacts like "\|" or "\(" showing in link labels or text.
export function rehypeUnescapePunctuation() {
  const UNSAFE_PARENTS = new Set(['code', 'pre', 'kbd', 'samp']);
  const pattern = /\\([\\|()\[\]{}*+.!_`~<>#\-])/g;

  return function (tree: any) {
    visit(tree, (node: any) => {
      if (!node || typeof node !== 'object') return;
      if (node.type !== 'element') return;
      if (UNSAFE_PARENTS.has(node.tagName)) return;
      const children = Array.isArray(node.children) ? node.children : [];
      for (const child of children) {
        if (child && child.type === 'text' && typeof child.value === 'string') {
          child.value = child.value.replace(pattern, '$1');
        }
      }
    });
  };
}


