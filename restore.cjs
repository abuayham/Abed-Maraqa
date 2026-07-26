const { createClient } = require(process.cwd() + '/node_modules/@supabase/supabase-js');
const fs = require('fs');
const content = fs.readFileSync('.env', 'utf8');
const urlMatch = content.match(/VITE_SUPABASE_URL\s*=\s*(.+)/);
const keyMatch = content.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.+)/);
const supabase = createClient(urlMatch[1], keyMatch[1]);
require('ts-node').register({ transpileOnly: true });
const { initialData } = require('./src/data.ts');

const newNodes = [];
const newEdges = [];

const traverse = (node, parentId, isRightStaff, isLeftStaff, isSibling) => {
  newNodes.push({
    id: node.id,
    type: 'orgNode',
    position: node.position || { x: Math.random() * 200, y: Math.random() * 200 },
    data: { title: node.title, color: node.color, textAlign: node.textAlign }
  });
  
  if (parentId) {
    newEdges.push({
      id: `e-${parentId}-${node.id}`,
      source: parentId,
      target: node.id,
      sourceHandle: isSibling ? 'left' : isRightStaff ? 'right' : (isLeftStaff ? 'left' : undefined),
      type: 'orgEdge',
      style: { strokeDasharray: node.lineStyle === 'dashed' ? '5,5' : 'none' }
    });
  }

  node.children?.forEach(c => traverse(c, node.id));
  node.rightStaff?.forEach(c => traverse(c, node.id, true));
  node.leftStaff?.forEach(c => traverse(c, node.id, false, true));
  if (node.leftSibling) traverse(node.leftSibling, node.id, false, false, true);
};

traverse(initialData);

(async () => {
  const res = await supabase.from('org_chart').upsert({ id: 1, data: { nodes: newNodes, edges: newEdges } });
  console.log('Restored!', res.status);
})();
