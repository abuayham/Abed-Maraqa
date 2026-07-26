import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Position,
  Handle,
  BaseEdge,
  getSmoothStepPath,
  EdgeLabelRenderer,
  MarkerType,
} from '@xyflow/react';
import type {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Edit2, Plus, Trash2, X, Check } from 'lucide-react';
import * as dagreModule from 'dagre';
const dagre: any = (dagreModule as any).default || dagreModule;

const PALETTE = [
  { key: 'green-dark',   bg: '#2d6a4f', text: '#fff',    label: 'أخضر غامق' },
  { key: 'green-light',  bg: '#52b788', text: '#fff',    label: 'أخضر' },
  { key: 'orange',       bg: '#e76f51', text: '#fff',    label: 'برتقالي' },
  { key: 'orange-light', bg: '#f4a261', text: '#1a1a1a', label: 'برتقالي فاتح' },
  { key: 'blue-light',   bg: '#a8dadc', text: '#1a1a1a', label: 'أزرق' },
  { key: 'peach',        bg: '#ffd7ba', text: '#1a1a1a', label: 'خوخي' },
  { key: 'teal',         bg: '#2a9d8f', text: '#fff',    label: 'أخضر زيتوني' },
];
const getClr = (key: string) => PALETTE.find(c => c.key === key) ?? PALETTE[0];

// ==================== LAYOUT ENGINE (DAGRE) ====================
export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  if (!dagre || !dagre.graphlib) {
    console.warn("Dagre layout engine is not available. Falling back to simple layout.");
    return { nodes, edges }; // Return as-is if dagre fails
  }

  try {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction, nodesep: 100, edgesep: 50, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 160, height: 80 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

    nodes.forEach((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      node.targetPosition = isHorizontal ? Position.Left : Position.Top;
      node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;
      node.position = {
        x: nodeWithPosition.x - 160 / 2,
        y: nodeWithPosition.y - 80 / 2,
      };
      return node;
    });
  } catch (err) {
    console.error("Dagre layout failed", err);
  }

  return { nodes, edges };
};

// ==================== CUSTOM NODE ====================
const CustomNode = ({ data, isConnectable, selected }: any) => {
  const clr = getClr(data.color);
  
  return (
    <div dir="rtl"
      style={{ 
        backgroundColor: clr.bg, 
        color: clr.text, 
        borderColor: selected ? '#3b82f6' : 'rgba(255,255,255,0.5)',
        textAlign: data.textAlign || 'center',
        fontSize: 'calc(12px + var(--font-size-offset, 0px))'
      }}
      className={`relative inline-flex flex-col items-center justify-center w-[160px] min-h-[60px] px-3 py-2 font-semibold rounded-lg shadow-md border-2 whitespace-pre-wrap leading-snug select-none transition-transform ${selected ? 'ring-4 ring-blue-500 scale-105 z-50' : 'hover:-translate-y-1'}`}
    >
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-3 h-3 bg-blue-500" />
      <Handle type="target" position={Position.Right} id="right" isConnectable={isConnectable} className="w-3 h-3 bg-green-500" />
      
      {data.title}

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-3 h-3 bg-red-500" />
      <Handle type="source" position={Position.Left} id="left" isConnectable={isConnectable} className="w-3 h-3 bg-yellow-500" />
    </div>
  );
};

// ==================== CUSTOM EDGE (WITH ADD BUTTON) ====================
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, data }: any) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 0
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeWidth: 'var(--line-thickness, 2px)', stroke: 'var(--line-color, #374151)' }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            onClick={() => data?.onAddNodeOnEdge?.(id, sourceX, sourceY, targetX, targetY)}
            className="bg-white border border-gray-300 text-blue-500 rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-blue-50 hover:scale-110 transition cursor-pointer text-lg font-bold leading-none pb-0.5"
            title="إضافة مستطيل في منتصف هذا السهم"
          >
            +
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// ==================== MAIN COMPONENT ====================
export default function FlowChart({ initialNodes, initialEdges, onSave, settings }: { initialNodes: Node[], initialEdges: Edge[], onSave: (n: Node[], e: Edge[]) => void, settings?: any }) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [editingNode, setEditingNode] = useState<Node | null>(null);

  const updateEditingNode = (updatedNode: Node) => {
    setEditingNode(updatedNode);
    const newNodes = nodes.map(n => n.id === updatedNode.id ? updatedNode : n);
    setNodes(newNodes);
    onSave(newNodes, edges);
  };

  const nodeTypes = useMemo(() => ({ orgNode: CustomNode }), []);
  
  const edgeTypes = useMemo(() => ({
    orgEdge: CustomEdge,
  }), []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const newNodes = applyNodeChanges(changes, nodes);
      setNodes(newNodes);
      onSave(newNodes, edges);
    },
    [nodes, edges, onSave]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const newEdges = applyEdgeChanges(changes, edges);
      setEdges(newEdges);
      onSave(nodes, newEdges);
    },
    [nodes, edges, onSave]
  );

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      const newEdge = { ...params, type: 'orgEdge', id: `e${Date.now()}` };
      const newEdges = addEdge(newEdge as any, edges);
      setEdges(newEdges);
      onSave(nodes, newEdges);
    },
    [nodes, edges, onSave]
  );

  const handleAddNodeOnEdge = useCallback((edgeId: string, sx: number, sy: number, tx: number, ty: number) => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;
    
    const newNodeId = `n${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      type: 'orgNode',
      position: { x: (sx + tx) / 2 - 80, y: (sy + ty) / 2 - 40 },
      data: { title: 'وظيفة جديدة', color: 'blue-light' }
    };
    
    const newEdge1: Edge = {
      id: `e${Date.now()}-1`,
      source: edge.source,
      target: newNodeId,
      sourceHandle: edge.sourceHandle,
      type: 'orgEdge'
    };
    
    const newEdge2: Edge = {
      id: `e${Date.now()}-2`,
      source: newNodeId,
      target: edge.target,
      targetHandle: edge.targetHandle,
      type: 'orgEdge'
    };

    const newNodes = [...nodes, newNode];
    const newEdges = edges.filter(e => e.id !== edgeId).concat([newEdge1, newEdge2]);
    
    setNodes(newNodes);
    setEdges(newEdges);
    onSave(newNodes, newEdges);
  }, [nodes, edges, onSave]);

  const edgesWithData = useMemo(() => edges.map(e => ({
    ...e,
    markerEnd: settings?.showArrows ? { type: MarkerType.ArrowClosed, color: 'var(--line-color, #374151)' } : undefined,
    data: { ...e.data, onAddNodeOnEdge: handleAddNodeOnEdge }
  })), [edges, handleAddNodeOnEdge, settings?.showArrows]);


  const handleAddStandalone = () => {
    const newNode: Node = {
      id: `n${Date.now()}`,
      type: 'orgNode',
      position: { x: Math.random() * 200, y: Math.random() * 200 },
      data: { title: 'مسمى جديد', color: 'orange-light' }
    };
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    onSave(newNodes, edges);
  };

  const handleAutoLayout = () => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
    onSave([...layoutedNodes], [...layoutedEdges]);
  };

  const selectedNode = nodes.find(n => n.selected);
  const selectedEdge = edges.find(e => e.selected);

  const handleDeleteSelected = () => {
    if (!selectedNode && !selectedEdge) return;
    if (confirm('هل أنت متأكد من حذف العنصر المحدد؟')) {
      let newNodes = nodes;
      let newEdges = edges;
      
      if (selectedNode) {
        newNodes = nodes.filter(n => n.id !== selectedNode.id);
        newEdges = edges.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id);
      } else if (selectedEdge) {
        newEdges = edges.filter(e => e.id !== selectedEdge.id);
      }
      
      setNodes(newNodes);
      setEdges(newEdges);
      onSave(newNodes, newEdges);
    }
  };

  return (
    <div className="absolute inset-0 flex">
      <div className="w-64 bg-white shadow-xl border-r p-4 flex flex-col gap-4 z-10 relative">
        <h3 className="font-bold text-gray-800 text-lg border-b pb-2">أدوات الرسم الحر</h3>
        
        <button onClick={handleAddStandalone} className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-sm flex items-center justify-center gap-2">
          <Plus size={16}/> إضافة مستطيل حر
        </button>
        
        <button onClick={handleAutoLayout} className="w-full py-2 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
          ✨ ترتيب تلقائي (شجري)
        </button>
        
        <hr className="my-2"/>

        {selectedNode && (
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
            <h4 className="font-bold text-blue-900 mb-2 text-sm">تعديل المستطيل المحدد</h4>
            <button onClick={() => setEditingNode(selectedNode)} className="w-full mb-2 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 text-sm flex items-center justify-center gap-1 font-medium"><Edit2 size={14}/> تعديل النص واللون</button>
            <button onClick={handleDeleteSelected} className="w-full py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm flex items-center justify-center gap-1 font-medium"><Trash2 size={14}/> حذف المستطيل</button>
          </div>
        )}

        {selectedEdge && (
          <div className="bg-green-50 p-3 rounded-xl border border-green-100">
            <h4 className="font-bold text-green-900 mb-2 text-sm">إعدادات السهم المحدد</h4>
            <div className="flex flex-col gap-2 text-sm mb-3">
              <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                <input type="checkbox" checked={selectedEdge.animated} onChange={e => {
                  const newEdges = edges.map(edge => edge.id === selectedEdge.id ? { ...edge, animated: e.target.checked } : edge);
                  setEdges(newEdges);
                  onSave(nodes, newEdges);
                }}/>
                سهم متحرك (Animated)
              </label>
              <label className="flex flex-col gap-1 text-gray-700">
                نوع الخط:
                <select className="p-1 rounded border" value={selectedEdge.style?.strokeDasharray ? 'dashed' : 'solid'} onChange={e => {
                  const isDashed = e.target.value === 'dashed';
                  const newEdges = edges.map(edge => edge.id === selectedEdge.id ? { 
                    ...edge, 
                    style: { ...edge.style, strokeDasharray: isDashed ? '5,5' : 'none' } 
                  } : edge);
                  setEdges(newEdges);
                  onSave(nodes, newEdges);
                }}>
                  <option value="solid">متصل</option>
                  <option value="dashed">متقطع</option>
                </select>
              </label>
            </div>
            <button onClick={handleDeleteSelected} className="w-full py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm flex items-center justify-center gap-1 font-medium"><X size={14}/> مسح هذا السهم</button>
          </div>
        )}

        <div className="mt-auto text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <p className="font-bold mb-1">💡 تلميحات احترافية:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>اسحب من النقطة الملونة في المستطيل لرسم سهم نحو مستطيل آخر.</li>
            <li>اضغط على الزر (+) الموجود في منتصف أي سهم لتقسيمه وإضافة وظيفة.</li>
            <li>للحذف، اضغط على السهم أو المستطيل لتحديده ثم استخدم زر الحذف.</li>
          </ul>
        </div>
      </div>

      <div className={`flex-1 relative bg-gray-50/50 h-full w-full ${settings?.showArrows ? 'show-arrows' : ''}`} dir="ltr">
        <ReactFlow
          nodes={nodes}
          edges={edgesWithData}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setEditingNode(node)}
          onNodeDoubleClick={(_, node) => setEditingNode(node)}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          style={{ width: '100%', height: '100%', fontSize: `calc(12px + var(--font-size-offset, 0px))` }}
          fitView
          defaultEdgeOptions={{ type: 'orgEdge' }}
        >
          <Background color="#ccc" gap={16} />
          <Controls />
        </ReactFlow>
      </div>

      {editingNode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-[420px] shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-800">✏️ تعديل المستطيل</h2>
              <button onClick={() => setEditingNode(null)} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition"><X size={20}/></button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">المسمى الوظيفي</label>
              <textarea value={editingNode.data.title as string} onChange={(e) => updateEditingNode({ ...editingNode, data: { ...editingNode.data, title: e.target.value } })} className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 resize-none transition" rows={3} autoFocus/>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">محاذاة النص</label>
              <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
                <button onClick={() => updateEditingNode({ ...editingNode, data: { ...editingNode.data, textAlign: 'right' } })} className={`px-4 py-1.5 rounded-lg text-sm transition ${editingNode.data.textAlign === 'right' ? 'bg-white shadow font-bold text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}>يمين</button>
                <button onClick={() => updateEditingNode({ ...editingNode, data: { ...editingNode.data, textAlign: 'center' } })} className={`px-4 py-1.5 rounded-lg text-sm transition ${(!editingNode.data.textAlign || editingNode.data.textAlign === 'center') ? 'bg-white shadow font-bold text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}>توسيط</button>
                <button onClick={() => updateEditingNode({ ...editingNode, data: { ...editingNode.data, textAlign: 'left' } })} className={`px-4 py-1.5 rounded-lg text-sm transition ${editingNode.data.textAlign === 'left' ? 'bg-white shadow font-bold text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}>يسار</button>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">اللون</label>
              <div className="flex flex-wrap gap-2.5">
                {PALETTE.map((p: any) => (
                  <button key={p.key} onClick={() => updateEditingNode({ ...editingNode, data: { ...editingNode.data, color: p.key } })} style={{ backgroundColor: p.bg }} className={`w-10 h-10 rounded-full border-4 transition-all shadow-sm ${editingNode.data.color === p.key ? 'border-blue-500 scale-110 shadow-md' : 'border-white hover:scale-105'}`} title={p.label}/>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center mt-6">
              <button onClick={() => {
                const newNodes = nodes.filter(n => n.id !== editingNode.id);
                const newEdges = edges.filter(e => e.source !== editingNode.id && e.target !== editingNode.id);
                setNodes(newNodes);
                setEdges(newEdges);
                onSave(newNodes, newEdges);
                setEditingNode(null);
              }} className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition font-medium flex items-center gap-1"><Trash2 size={15}/> حذف</button>
              
              <div className="flex gap-2">
                <button onClick={() => setEditingNode(null)} className="px-8 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold shadow-md flex items-center gap-2"><Check size={16}/> تم</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
