import { useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
} from '@xyflow/react';
import dagre from 'dagre';
import '@xyflow/react/dist/style.css';

import { initialNodes, initialEdges } from './initialOrgData';
import CustomOrgNode from './CustomOrgNode';
import RoutingNode from './RoutingNode';
import AdjustableStepEdge from './AdjustableStepEdge';

const nodeTypes = {
  orgNode: CustomOrgNode,
  routingNode: RoutingNode,
};

const edgeTypes = {
  step: AdjustableStepEdge,
};

const LOCAL_STORAGE_KEY = 'org-chart-flow';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 100 });

  nodes.forEach((node) => {
    const w = node.type === 'routingNode' ? 10 : 250;
    const h = node.type === 'routingNode' ? 10 : 100;
    dagreGraph.setNode(node.id, { width: w, height: h });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - (node.type === 'routingNode' ? 5 : 125),
        y: nodeWithPosition.y - (node.type === 'routingNode' ? 5 : 50),
      },
      draggable: false,
    };
    return newNode;
  });

  return { nodes: newNodes, edges };
};

export const AutoLayoutChart = () => {
  const [nodes, setNodes] = useNodesState<any>([]);
  const [edges, setEdges] = useEdgesState<any>([]);

  useEffect(() => {
    const restoreFlow = () => {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      let loadedNodes = initialNodes;
      let loadedEdges = initialEdges;
      if (stored) {
        const flow = JSON.parse(stored);
        if (flow && flow.nodes) loadedNodes = flow.nodes;
        if (flow && flow.edges) loadedEdges = flow.edges;
      }
      
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        loadedNodes,
        loadedEdges,
        'TB'
      );
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    };
    
    restoreFlow();
  }, [setNodes, setEdges]);

  return (
    <div className="w-full h-full bg-slate-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        dir="ltr"
        nodesConnectable={false}
        nodesDraggable={false}
        elementsSelectable={false}
      >
        <Background gap={20} size={1} color="#e2e8f0" />
        <Controls />
        <MiniMap zoomable pannable />
        <Panel position="top-right" className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 max-w-sm">
          <h3 className="font-bold text-lg mb-2 text-blue-800">التصميم التلقائي (Auto Layout)</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            هذا العرض يقوم بترتيب العقد بشكل شجري عمودي بطريقة آلية، باستخدام نفس البيانات الخاصة بالتصميم الحر. 
            لا يمكن التعديل هنا لضمان الحفاظ على التناسق.
          </p>
        </Panel>
      </ReactFlow>
    </div>
  );
};
