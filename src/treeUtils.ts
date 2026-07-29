import type { TreeNode } from './data';

export const cloneTree = (node: TreeNode): TreeNode => {
  return {
    ...node,
    children: node.children ? node.children.map(cloneTree) : undefined
  };
};

export const updateNodeAtPath = (current: TreeNode, path: number[], newProps: Partial<TreeNode>): TreeNode => {
  if (path.length === 0) {
    return { ...current, ...newProps };
  }
  const idx = path[0];
  const newChildren = [...(current.children || [])];
  newChildren[idx] = updateNodeAtPath(newChildren[idx], path.slice(1), newProps);
  return { ...current, children: newChildren };
};

export const addChildAtPath = (current: TreeNode, path: number[], childProps?: Partial<TreeNode>): TreeNode => {
  if (path.length === 0) {
    const newChild: TreeNode = {
      id: `node_${Date.now()}`,
      title: childProps?.title || 'قسم جديد',
      color: childProps?.color || (current.color === 'green-dark' ? 'green-light' : 'blue-light'),
      isAssistant: childProps?.isAssistant,
      isSideStaff: childProps?.isSideStaff,
      isDashedLine: childProps?.isDashedLine
    };
    return { ...current, children: [...(current.children || []), newChild] };
  }
  const idx = path[0];
  const newChildren = [...(current.children || [])];
  newChildren[idx] = addChildAtPath(newChildren[idx], path.slice(1), childProps);
  return { ...current, children: newChildren };
};

export const deleteNodeAtPath = (current: TreeNode, path: number[]): TreeNode | null => {
  if (path.length === 0) return null; // Cannot delete root
  if (path.length === 1) {
    const newChildren = [...(current.children || [])];
    newChildren.splice(path[0], 1);
    return { ...current, children: newChildren };
  }
  const idx = path[0];
  const newChildren = [...(current.children || [])];
  const updatedChild = deleteNodeAtPath(newChildren[idx], path.slice(1));
  if (updatedChild) {
    newChildren[idx] = updatedChild;
  }
  return { ...current, children: newChildren };
};

export const getNodeAtPath = (current: TreeNode, path: number[]): TreeNode | null => {
  if (path.length === 0) return current;
  if (!current.children) return null;
  return getNodeAtPath(current.children[path[0]], path.slice(1));
};

export const moveNode = (root: TreeNode, fromPath: number[], toParentPath: number[], toIndex?: number): TreeNode => {
  const nodeToMove = getNodeAtPath(root, fromPath);
  if (!nodeToMove) return root;

  // Prevent moving a node into itself or its descendants
  if (toParentPath.length >= fromPath.length) {
    const isDescendant = fromPath.every((val, i) => val === toParentPath[i]);
    if (isDescendant) return root; // Cannot move into itself
  }

  // 1. Remove the node
  let newRoot = deleteNodeAtPath(cloneTree(root), fromPath);
  if (!newRoot) return root;

  // If moving within the same parent, we must adjust indices if 'from' was before 'to'
  let adjustedToIndex = toIndex;
  const isSameParent = fromPath.length === toParentPath.length + 1 && fromPath.slice(0, -1).every((val, i) => val === toParentPath[i]);
  if (isSameParent && toIndex !== undefined) {
    const fromIndex = fromPath[fromPath.length - 1];
    if (fromIndex < toIndex) {
      adjustedToIndex = toIndex - 1;
    }
  }

  // 2. Add the node to the new parent
  const addNodeToParent = (current: TreeNode, path: number[]): TreeNode => {
    if (path.length === 0) {
      const newChildren = [...(current.children || [])];
      if (adjustedToIndex !== undefined) {
        newChildren.splice(adjustedToIndex, 0, nodeToMove);
      } else {
        newChildren.push(nodeToMove);
      }
      return { ...current, children: newChildren };
    }
    const idx = path[0];
    const newChildren = [...(current.children || [])];
    newChildren[idx] = addNodeToParent(newChildren[idx], path.slice(1));
    return { ...current, children: newChildren };
  };

  return addNodeToParent(newRoot, toParentPath);
};

export const addSibling = (root: TreeNode, path: number[], position: 'before' | 'after', childProps?: Partial<TreeNode>): TreeNode => {
  if (path.length === 0) return root; // Cannot add sibling to root
  const parentPath = path.slice(0, -1);
  const targetIndex = path[path.length - 1];
  const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;

  const newChild: TreeNode = {
    id: `node_${Date.now()}`,
    title: childProps?.title || 'قسم جديد',
    color: childProps?.color || 'blue-light',
    ...childProps
  };

  const insertSibling = (current: TreeNode, p: number[]): TreeNode => {
    if (p.length === 0) {
      const newChildren = [...(current.children || [])];
      newChildren.splice(insertIndex, 0, newChild);
      return { ...current, children: newChildren };
    }
    const idx = p[0];
    const newChildren = [...(current.children || [])];
    newChildren[idx] = insertSibling(newChildren[idx], p.slice(1));
    return { ...current, children: newChildren };
  };

  return insertSibling(root, parentPath);
};
