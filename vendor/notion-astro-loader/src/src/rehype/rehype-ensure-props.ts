import { visit } from 'unist-util-visit';

// Ensure every element node has a properties object and a className array.
export function rehypeEnsureProps() {
  return function (tree: any) {
    visit(tree, (node: any) => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'element') {
        if (!node.properties || typeof node.properties !== 'object') {
          node.properties = {};
        }
        const cls = (node.properties as any).className;
        if (cls == null) {
          (node.properties as any).className = [];
        } else if (typeof cls === 'string') {
          (node.properties as any).className = [cls];
        } else if (!Array.isArray(cls)) {
          (node.properties as any).className = [];
        }
      }
    });
  };
}


