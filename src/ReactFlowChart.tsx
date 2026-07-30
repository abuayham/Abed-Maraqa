import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import CustomOrgNode from './CustomOrgNode';
import RoutingNode from './RoutingNode';
import AdjustableStepEdge from './AdjustableStepEdge';

import { exportToImage, exportToWord, exportToPdf } from './exportUtils';
import { Image as ImageIcon, FileText, File, Undo2, Redo2, Group as GroupIcon, Ungroup, PaintBucket, MoveHorizontal, MoveVertical } from 'lucide-react';

import { initialNodes, initialEdges } from './initialOrgData';

const nodeTypes = {
  orgNode: CustomOrgNode,
  routingNode: RoutingNode,
};

const edgeTypes = {
  step: AdjustableStepEdge,
};

const getId = () => `dndnode_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

const ReactFlowChartInner = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const savedNodesStr = localStorage.getItem('flow-nodes');
  const savedEdgesStr = localStorage.getItem('flow-edges');
  let parsedNodes = initialNodes;
  let parsedEdges = initialEdges;
  try {
    if (savedNodesStr) parsedNodes = JSON.parse(savedNodesStr);
    if (savedEdgesStr) parsedEdges = JSON.parse(savedEdgesStr);
  } catch (e) {
    console.error("Could not parse saved flow data", e);
  }

  const [nodes, setNodes, onNodesChange] = useNodesState(parsedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(parsedEdges);

  useEffect(() => {
    localStorage.setItem('flow-nodes', JSON.stringify(nodes));
    localStorage.setItem('flow-edges', JSON.stringify(edges));
  }, [nodes, edges]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  const [past, setPast] = useState<{nodes: Node[], edges: Edge[]}[]>([]);
  const [future, setFuture] = useState<{nodes: Node[], edges: Edge[]}[]>([]);
  
  const [selectionQueue, setSelectionQueue] = useState<string[]>([]);

  const onSelectionChange = useCallback(({ nodes: selectedNodesList }: { nodes: Node[] }) => {
    setSelectionQueue(prev => {
       const currentIds = selectedNodesList.map(n => n.id);
       const newQueue = prev.filter(id => currentIds.includes(id));
       currentIds.forEach(id => {
          if (!newQueue.includes(id)) newQueue.push(id);
       });
       return newQueue;
    });
  }, []);

  const takeSnapshot = useCallback(() => {
    setPast((p) => [...p, { nodes, edges }]);
    setFuture([]);
  }, [nodes, edges]);

  const onUndo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [{ nodes, edges }, ...f]);
    setNodes(previous.nodes);
    setEdges(previous.edges);
  }, [past, nodes, edges, setNodes, setEdges]);

  const onRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, { nodes, edges }]);
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [future, nodes, edges, setNodes, setEdges]);

  const handleGroup = useCallback(() => {
    const selectedNodes = nodes.filter(n => n.selected && n.type !== 'group');
    if (selectedNodes.length < 2) return alert('الرجاء تحديد أكثر من وظيفة للتجميع (استخدم Shift للتحديد المتعدد)');
    takeSnapshot();
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    selectedNodes.forEach(n => {
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + (n.measured?.width || 160));
      maxY = Math.max(maxY, n.position.y + (n.measured?.height || 60));
    });

    const padding = 20;
    const groupId = getId();
    const groupNode: Node = {
      id: groupId,
      type: 'group',
      position: { x: minX - padding, y: minY - padding },
      style: { width: maxX - minX + padding * 2, height: maxY - minY + padding * 2, backgroundColor: 'rgba(230, 240, 255, 0.4)', border: '2px dashed #4f46e5', borderRadius: 8 },
      data: {}
    };

    setNodes(nds => [
      groupNode,
      ...nds.map(n => {
        if (n.selected && n.type !== 'group') {
          return { ...n, parentId: groupId, position: { x: n.position.x - (minX - padding), y: n.position.y - (minY - padding) }, extent: 'parent' as const };
        }
        return n;
      })
    ]);
  }, [nodes, takeSnapshot, setNodes]);

  const handleUngroup = useCallback(() => {
    const selectedGroups = nodes.filter(n => n.selected && n.type === 'group');
    if (selectedGroups.length === 0) return alert('الرجاء تحديد مجموعة (صندوق) لفكها');
    takeSnapshot();
    
    const groupIds = new Set(selectedGroups.map(g => g.id));
    setNodes(nds => {
      const remaining = nds.filter(n => !groupIds.has(n.id));
      return remaining.map(n => {
        if (n.parentId && groupIds.has(n.parentId)) {
          const parent = selectedGroups.find(g => g.id === n.parentId);
          return { ...n, parentId: undefined, position: { x: (parent?.position.x || 0) + n.position.x, y: (parent?.position.y || 0) + n.position.y }, extent: undefined };
        }
        return n;
      });
    });
  }, [nodes, takeSnapshot, setNodes]);

  const handleMatchFormatting = useCallback(() => {
    const selectedNodes = nodes.filter(n => n.selected && n.type !== 'group' && n.type !== 'routingNode');
    if (selectedNodes.length < 2) return alert('الرجاء تحديد أكثر من وظيفة لتوحيد التنسيق (استخدم Shift للتحديد المتعدد). الوظيفة الأقرب أو الأقدم في التحديد ستكون هي المرجع.');

    takeSnapshot();
    
    // The first selected node in the queue is the reference
    const referenceNodeId = selectionQueue.find(id => selectedNodes.some(n => n.id === id));
    const referenceNode = selectedNodes.find(n => n.id === referenceNodeId) || selectedNodes[0];
    const refWidth = referenceNode.measured?.width || referenceNode.style?.width || 160;
    const refHeight = referenceNode.measured?.height || referenceNode.style?.height || 60;
    const refColor = referenceNode.data.color;
    const refFontSize = referenceNode.data.fontSize;
    const refTextColor = referenceNode.data.textColor;
    const refIsBold = referenceNode.data.isBold;

    setNodes(nds => nds.map(n => {
      if (n.selected && n.id !== referenceNode.id && n.type !== 'group' && n.type !== 'routingNode') {
        return {
          ...n,
          style: { ...n.style, width: refWidth, height: refHeight },
          data: { ...n.data, color: refColor, fontSize: refFontSize, textColor: refTextColor, isBold: refIsBold }
        };
      }
      return n;
    }));
  }, [nodes, takeSnapshot, setNodes, selectionQueue]);

  const handleAlignAndDistribute = useCallback((axis: 'horizontal' | 'vertical') => {
    const selectedNodes = nodes.filter(n => n.selected && n.type === 'orgNode');
    if (selectedNodes.length < 2) return alert('الرجاء تحديد مستطيلين أو أكثر للمحاذاة');
    
    takeSnapshot();
    
    if (axis === 'horizontal') {
      const avgY = selectedNodes.reduce((sum, n) => sum + n.position.y, 0) / selectedNodes.length;
      if (selectedNodes.length === 2) {
        setNodes(nds => nds.map(n => selectedNodes.find(sn => sn.id === n.id) ? { ...n, position: { ...n.position, y: avgY } } : n));
        return;
      }
      const sorted = [...selectedNodes].sort((a, b) => a.position.x - b.position.x);
      const minX = sorted[0].position.x;
      const maxX = sorted[sorted.length - 1].position.x;
      const stepX = (maxX - minX) / (sorted.length - 1);
      
      setNodes(nds => nds.map(n => {
        const index = sorted.findIndex(sn => sn.id === n.id);
        if (index !== -1) return { ...n, position: { x: minX + (stepX * index), y: avgY } };
        return n;
      }));
    } else {
      const avgX = selectedNodes.reduce((sum, n) => sum + n.position.x, 0) / selectedNodes.length;
      if (selectedNodes.length === 2) {
        setNodes(nds => nds.map(n => selectedNodes.find(sn => sn.id === n.id) ? { ...n, position: { ...n.position, x: avgX } } : n));
        return;
      }
      const sorted = [...selectedNodes].sort((a, b) => a.position.y - b.position.y);
      const minY = sorted[0].position.y;
      const maxY = sorted[sorted.length - 1].position.y;
      const stepY = (maxY - minY) / (sorted.length - 1);
      
      setNodes(nds => nds.map(n => {
        const index = sorted.findIndex(sn => sn.id === n.id);
        if (index !== -1) return { ...n, position: { x: avgX, y: minY + (stepY * index) } };
        return n;
      }));
    }
  }, [nodes, setNodes, takeSnapshot]);

  const onNodeDragStart = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);

  const onNodeDragStop = useCallback((event: any, node: Node) => {
    if (node.type === 'routingNode') {
      const nodeEl = document.querySelector(`[data-id="${node.id}"]`) as HTMLElement;
      if (nodeEl) {
        const originalEvents = nodeEl.style.pointerEvents;
        nodeEl.style.pointerEvents = 'none';
        const elements = document.elementsFromPoint(event.clientX, event.clientY);
        nodeEl.style.pointerEvents = originalEvents;

        const edgePath = elements.find(el => el.classList.contains('react-flow__edge-path'));
        if (edgePath) {
           const edgeGroup = edgePath.closest('.react-flow__edge');
           const edgeId = edgeGroup?.getAttribute('data-id');
           
           if (edgeId) {
              setEdges(eds => {
                 const edge = eds.find(e => e.id === edgeId);
                 if (!edge) return eds;
                 
                 const newEds = eds.filter(e => e.id !== edgeId);
                 newEds.push({
                    id: getId(),
                    source: edge.source,
                    sourceHandle: edge.sourceHandle,
                    target: node.id,
                    targetHandle: 'top-target',
                    type: edge.type || 'step',
                    style: edge.style,
                    animated: edge.animated
                 });
                 newEds.push({
                    id: getId(),
                    source: node.id,
                    sourceHandle: 'bottom-source',
                    target: edge.target,
                    targetHandle: edge.targetHandle,
                    type: edge.type || 'step',
                    style: edge.style,
                    animated: edge.animated
                 });
                 
                 // Make the routing node a child of the edge's source so it moves with it
                 setNodes(nds => {
                    const sourceNode = nds.find(n => n.id === edge.source);
                    if (!sourceNode) return nds;
                    return nds.map(n => {
                       if (n.id === node.id) {
                          return {
                             ...n,
                             parentId: sourceNode.id,
                             position: {
                                x: n.position.x - sourceNode.position.x,
                                y: n.position.y - sourceNode.position.y
                             }
                          };
                       }
                       return n;
                    });
                 });
                 
                 return newEds;
              });
           }
        }
      }
    }
  }, [setEdges]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      takeSnapshot();
      setEdges((eds) => addEdge({ ...params, type: 'step', style: { strokeWidth: 2, stroke: '#000' } } as Edge, eds));
    },
    [setEdges, takeSnapshot],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance) {
        console.warn('ReactFlow instance not ready');
        return;
      }

      const type = event.dataTransfer.getData('application/reactflow');
      const color = event.dataTransfer.getData('application/nodecolor');
      const title = event.dataTransfer.getData('application/nodetitle');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: { label: title, color: color },
      };

      takeSnapshot();
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, takeSnapshot],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const edgeClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    if (edgeClickTimer.current) clearTimeout(edgeClickTimer.current);
    edgeClickTimer.current = setTimeout(() => {
      setSelectedEdge(edge);
    }, 250);
  }, []);

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    event.stopPropagation();
    if (edgeClickTimer.current) clearTimeout(edgeClickTimer.current);
    takeSnapshot();
    setSelectedEdge(null); // Close the edge properties modal if it opened
    
    if (!reactFlowInstance) return;

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newRoutingNodeId = getId();
    const newRoutingNode: Node = {
      id: newRoutingNodeId,
      type: 'routingNode',
      position,
      data: { label: 'مفصل' },
    };

    setNodes((nds) => nds.concat(newRoutingNode));
    
    setEdges((eds) => {
      const edgeToSplit = eds.find(e => e.id === edge.id);
      if (!edgeToSplit) return eds;
      
      const filteredEds = eds.filter(e => e.id !== edge.id);
      return [
        ...filteredEds,
        {
          id: getId(),
          source: edgeToSplit.source,
          sourceHandle: edgeToSplit.sourceHandle,
          target: newRoutingNodeId,
          targetHandle: null,
          type: edgeToSplit.type || 'step',
          style: edgeToSplit.style,
          animated: edgeToSplit.animated
        },
        {
          id: getId(),
          source: newRoutingNodeId,
          sourceHandle: null,
          target: edgeToSplit.target,
          targetHandle: edgeToSplit.targetHandle,
          type: edgeToSplit.type || 'step',
          style: edgeToSplit.style,
          animated: edgeToSplit.animated
        }
      ];
    });
  }, [reactFlowInstance, setEdges, setNodes, takeSnapshot]);

  const handleUpdateNode = (updatedData: any) => {
    takeSnapshot();
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode?.id) {
          node.data = {
            ...node.data,
            label: updatedData.title,
            color: updatedData.color,
            fontSize: updatedData.fontSize,
            textColor: updatedData.textColor,
            isBold: updatedData.isBold
          };
        }
        return node;
      })
    );
    setSelectedNode(null);
  };

  const handleDeleteNode = () => {
    if (!selectedNode) return;
    takeSnapshot();
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  const handleUpdateEdge = (updatedData: any) => {
    takeSnapshot();
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === selectedEdge?.id) {
          const style = { ...edge.style, strokeWidth: 2, stroke: '#000' };
          if (updatedData.lineStyle === 'dashed') {
            style.strokeDasharray = '5,5';
          } else {
            delete style.strokeDasharray;
          }
          return {
            ...edge,
            type: updatedData.type,
            style,
            animated: updatedData.animated,
          };
        }
        return edge;
      })
    );
    setSelectedEdge(null);
  };

  const handleDeleteEdge = () => {
    if (!selectedEdge) return;
    takeSnapshot();
    setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
    setSelectedEdge(null);
  };

  return (
    <div className="flex w-full h-[calc(100vh-64px)] bg-gray-50 flex-col">
      {/* أزرار التصدير والتحكم (الشريط العلوي) */}
      <div className="w-full bg-white border-b px-4 py-3 flex gap-4 items-center justify-center z-10 shadow-sm" dir="rtl">
        <div className="bg-white rounded-lg shadow border flex overflow-hidden">
          <button onClick={onUndo} disabled={past.length === 0} className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50 text-gray-700 border-l flex gap-1 items-center" title="تراجع"><Undo2 size={18} /> تراجع</button>
          <button onClick={onRedo} disabled={future.length === 0} className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50 text-gray-700 flex gap-1 items-center" title="إعادة"><Redo2 size={18} /> إعادة</button>
        </div>

        <div className="bg-white rounded-lg shadow border flex overflow-hidden">
          <button onClick={handleGroup} className="px-3 py-2 hover:bg-gray-100 text-blue-700 font-bold flex gap-1 items-center border-l" title="تجميع الوظائف المحددة"><GroupIcon size={18} /> تجميع</button>
          <button onClick={handleUngroup} className="px-3 py-2 hover:bg-gray-100 text-red-600 font-bold flex gap-1 items-center" title="فك التجميع"><Ungroup size={18} /> فك</button>
        </div>

        <div className="bg-white rounded-lg shadow border flex overflow-hidden">
          <button onClick={handleMatchFormatting} className="px-3 py-2 hover:bg-gray-100 text-green-700 font-bold flex gap-1 items-center" title="نسخ تنسيق وحجم أول وظيفة محددة وتطبيقها على الباقي"><PaintBucket size={18} /> توحيد التنسيق</button>
        </div>

        <div className="bg-white rounded-lg shadow border flex overflow-hidden">
          <button onClick={() => handleAlignAndDistribute('horizontal')} className="px-3 py-2 hover:bg-gray-100 text-purple-700 font-bold flex gap-1 items-center border-l" title="محاذاة المستطيلات المحددة على نفس الخط الأفقي وتوزيع المسافات بالتساوي"><MoveHorizontal size={18} /> محاذاة أفقية</button>
          <button onClick={() => handleAlignAndDistribute('vertical')} className="px-3 py-2 hover:bg-gray-100 text-purple-700 font-bold flex gap-1 items-center" title="محاذاة المستطيلات المحددة عمودياً وتوزيع المسافات بالتساوي"><MoveVertical size={18} /> محاذاة عمودية</button>
        </div>

        <button 
          onClick={() => exportToPdf()} 
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 font-bold transition-colors"
        >
          <File size={18} />
          تصدير PDF (A4)
        </button>
        <button 
          onClick={() => exportToImage('react-flow')} 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 font-bold transition-colors"
        >
          <ImageIcon size={18} />
          تصدير صورة (A4)
        </button>
        <button 
          onClick={() => exportToWord(nodes, edges)} 
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 font-bold transition-colors"
        >
          <FileText size={18} />
          تصدير Word
        </button>
      </div>

      <div className="flex-1 w-full relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onSelectionChange={onSelectionChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onEdgeContextMenu={onEdgeContextMenu}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={{ ...edgeTypes, adjustable: AdjustableStepEdge }}
          nodesConnectable={true}
          fitView
          dir="ltr" // React Flow works best with LTR coordinates internally
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls />
          <MiniMap zoomable pannable nodeColor={(n: any) => {
              if (n.data?.color === 'green-dark') return '#15803d';
              if (n.data?.color === 'orange') return '#ee8354';
              if (n.data?.color === 'blue-light') return '#87c6cf';
              return '#eee';
          }} />
        </ReactFlow>

        <div className="absolute top-4 left-4 z-10 bg-white p-3 rounded-lg shadow-md border text-sm text-gray-700 font-bold opacity-80 pointer-events-none" dir="rtl">
          💡 اسحب المستطيلات من القائمة لإضافتها.
          <br/>
          🔗 اسحب بالماوس من النقاط لربط الأسهم.
          <br/>
          🖱️ اضغط بزر الماوس الأيمن (Right Click) على أي سهم لإنشاء نقطة انحناء.
          <br/>
          🖱️ اضغط على المربع لتعديل لونه والنص.
          <br/>
          ❌ اضغط على السهم ثم Delete لحذفه.
        </div>
      </div>
      {selectedNode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">تعديل الوظيفة</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">المسمى الوظيفي</label>
              <input
                type="text"
                defaultValue={selectedNode.data.label as string}
                id="edit-node-title"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">اللون</label>
              <select id="edit-node-color" defaultValue={selectedNode.data.color as string} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option value="green-dark">أخضر غامق (رئيسي)</option>
                <option value="green-light">أخضر فاتح</option>
                <option value="orange">برتقالي (نواب)</option>
                <option value="orange-light">برتقالي فاتح</option>
                <option value="blue-light">أزرق (عمداء)</option>
                <option value="teal">أخضر مزرق</option>
                <option value="peach">خوخي (مراكز)</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">حجم الخط</label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  id="edit-node-font-size" 
                  min="10" 
                  max="40" 
                  defaultValue={selectedNode.data.fontSize as number || 14} 
                  className="w-full"
                  onInput={(e) => {
                    document.getElementById('font-size-display')!.innerText = e.currentTarget.value + 'px';
                  }}
                />
                <span id="font-size-display" className="font-bold text-gray-700">{selectedNode.data.fontSize as number || 14}px</span>
              </div>
            </div>

            <div className="mb-6 flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">لون الخط</label>
                <input 
                  type="color" 
                  id="edit-node-text-color" 
                  defaultValue={selectedNode.data.textColor as string || (['green-light', 'orange-light', 'blue-light', 'peach'].includes(selectedNode.data.color as string) ? '#1f2937' : '#ffffff')}
                  className="w-full h-10 p-1 rounded border border-gray-300"
                />
              </div>
              <div className="flex items-center gap-2 mt-7">
                <input 
                  type="checkbox" 
                  id="edit-node-is-bold" 
                  defaultChecked={selectedNode.data.isBold !== false} 
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                />
                <label htmlFor="edit-node-is-bold" className="text-sm font-semibold text-gray-700 cursor-pointer">خط عريض (Bold)</label>
              </div>
            </div>

            <div className="flex justify-between border-t pt-4">
              <button 
                onClick={handleDeleteNode}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100"
              >
                حذف الوظيفة
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  إلغاء
                </button>
                <button 
                  onClick={() => {
                    const title = (document.getElementById('edit-node-title') as HTMLInputElement).value;
                    const color = (document.getElementById('edit-node-color') as HTMLSelectElement).value;
                    const fontSize = parseInt((document.getElementById('edit-node-font-size') as HTMLInputElement).value);
                    const textColor = (document.getElementById('edit-node-text-color') as HTMLInputElement).value;
                    const isBold = (document.getElementById('edit-node-is-bold') as HTMLInputElement).checked;
                    handleUpdateNode({ title, color, fontSize, textColor, isBold });
                  }}
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                >
                  حفظ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedEdge && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">خصائص السهم</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">نوع الخط</label>
              <select id="edit-edge-style" defaultValue={selectedEdge.style?.strokeDasharray ? 'dashed' : 'solid'} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option value="solid">متصل (Solid)</option>
                <option value="dashed">مقطع (Dashed)</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">شكل الزاوية والتوجيه</label>
              <select id="edit-edge-type" defaultValue={selectedEdge.type || 'step'} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                <option value="step">زاوية قائمة (Step)</option>
                <option value="smoothstep">زاوية منحنية (Smooth Step)</option>
                <option value="straight">خط مستقيم (Straight)</option>
                <option value="default">منحنى (Bezier)</option>
              </select>
            </div>

            <div className="mb-6 flex items-center gap-2">
              <input type="checkbox" id="edit-edge-animated" defaultChecked={selectedEdge.animated} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
              <label htmlFor="edit-edge-animated" className="text-sm font-semibold text-gray-700">تأثير الحركة (Animated)</label>
            </div>

            <div className="flex justify-between border-t pt-4">
              <button 
                onClick={handleDeleteEdge}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100"
              >
                حذف السهم
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedEdge(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  إلغاء
                </button>
                <button 
                  onClick={() => {
                    const lineStyle = (document.getElementById('edit-edge-style') as HTMLSelectElement).value;
                    const type = (document.getElementById('edit-edge-type') as HTMLSelectElement).value;
                    const animated = (document.getElementById('edit-edge-animated') as HTMLInputElement).checked;
                    handleUpdateEdge({ lineStyle, type, animated });
                  }}
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                >
                  حفظ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ReactFlowChart = () => (
  <ReactFlowProvider>
    <ReactFlowChartInner />
  </ReactFlowProvider>
);
