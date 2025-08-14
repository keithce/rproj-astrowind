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

      // Normalize anchor hrefs
      if (isElement && tag === 'a' && node.properties?.href) {
        try {
          node.properties.href = decodeURI(String(node.properties.href));
        } catch {}
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