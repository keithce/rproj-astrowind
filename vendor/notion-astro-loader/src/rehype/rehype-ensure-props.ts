// Ensure every element node has a properties object and a className array.
// Avoids using unist visitors to prevent crashes on malformed trees.
export function rehypeEnsureProps() {
  return function (tree: any) {
    const stack: any[] = [];
    if (tree && typeof tree === 'object') stack.push(tree);

    while (stack.length > 0) {
      const node = stack.pop();
      if (!node || typeof node !== 'object') continue;

      // Normalize children to an array of objects
      if (!Array.isArray(node.children)) {
        node.children = [];
      } else {
        node.children = node.children.filter((c: any) => c && typeof c === 'object');
      }

      // Ensure props/className on elements
      if (node.type === 'element') {
        if (!node.properties || typeof node.properties !== 'object') {
          node.properties = {};
        }
        const props: any = node.properties as any;
        const cls = props.className;
        if (cls == null) {
          props.className = [];
        } else if (typeof cls === 'string') {
          props.className = [cls];
        } else if (!Array.isArray(cls)) {
          props.className = [];
        }
      }

      // Traverse
      for (const child of node.children as any[]) {
        if (child && typeof child === 'object') {
          stack.push(child);
        }
      }
    }
  };
}


