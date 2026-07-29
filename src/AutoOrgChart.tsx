import React, { useState } from 'react';
import type { TreeNode } from './data';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { EditNodeModal } from './EditNodeModal';
import { updateNodeAtPath, addChildAtPath, deleteNodeAtPath, addSibling } from './treeUtils';
import { ZoomIn, ZoomOut, Target, Plus, Minus } from 'lucide-react';

interface AutoOrgChartProps {
  data: TreeNode;
  onChange: (newData: TreeNode) => void;
}

const ChartControls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="absolute bottom-6 left-6 z-20 flex gap-2 bg-white p-2 rounded-xl shadow-lg border border-gray-200">
      <button onClick={() => zoomIn()} className="p-2 hover:bg-gray-100 rounded-lg text-gray-700" title="تكبير"><ZoomIn size={20} /></button>
      <button onClick={() => zoomOut()} className="p-2 hover:bg-gray-100 rounded-lg text-gray-700" title="تصغير"><ZoomOut size={20} /></button>
      <div className="w-px bg-gray-200 mx-1"></div>
      <button onClick={() => resetTransform()} className="p-2 hover:bg-gray-100 rounded-lg text-green-600" title="العودة للمركز"><Target size={20} /></button>
    </div>
  );
};

const NodeCard = ({ 
  node, 
  path, 
  onNodeClick, 
  onToggleCollapse 
}: { 
  node: TreeNode, 
  path: number[], 
  onNodeClick: (node: TreeNode, path: number[]) => void,
  onToggleCollapse: (e: React.MouseEvent, path: number[], isCollapsed: boolean) => void 
}) => {
  let bgClass = "bg-green-700 text-white";
  if (node.color === "green-light") bgClass = "bg-[#80b157] text-white";
  else if (node.color === "orange") bgClass = "bg-[#ee8354] text-white";
  else if (node.color === "orange-light") bgClass = "bg-[#f5b89a] text-gray-800";
  else if (node.color === "blue-light") bgClass = "bg-[#87c6cf] text-gray-800";
  else if (node.color === "teal") bgClass = "bg-[#4da8b0] text-white";
  else if (node.color === "peach") bgClass = "bg-[#fad3c6] text-gray-800";

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="relative group flex flex-col items-center">
      <div 
        onClick={() => onNodeClick(node, path)}
        className={`shadow-md border-2 border-white rounded-md p-3 text-center w-40 min-h-[60px] flex items-center justify-center font-bold text-sm cursor-pointer hover:scale-105 hover:shadow-lg transition-transform ${bgClass}`}
      >
        {node.title}
      </div>
      
      {hasChildren && (
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleCollapse(e, path, !node.isCollapsed); }}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-blue-600 shadow-sm z-20 cursor-pointer transition-transform hover:scale-110"
          title={node.isCollapsed ? "عرض الفروع" : "طي الفروع"}
        >
          {node.isCollapsed ? <Plus size={14} strokeWidth={3} /> : <Minus size={14} strokeWidth={3} />}
        </button>
      )}
    </div>
  );
};

const OrgNodeRenderer = ({ 
  node, 
  path, 
  isRoot = false, 
  onNodeClick,
  onToggleCollapse
}: { 
  node: TreeNode, 
  path: number[], 
  isRoot?: boolean, 
  onNodeClick: (node: TreeNode, path: number[]) => void,
  onToggleCollapse: (e: React.MouseEvent, path: number[], isCollapsed: boolean) => void 
}) => {
  const sideStaff = node.children?.filter(c => c.isSideStaff) || [];
  const standardChildren = node.children?.filter(c => !c.isSideStaff) || [];
  const showChildren = !node.isCollapsed;

  return (
    <div className={`org-tree-node flex flex-col items-center relative ${!isRoot ? 'pt-12' : ''}`}>
      {!isRoot && (
        <div className="absolute top-0 left-1/2 w-0.5 h-12 bg-gray-600 -translate-x-1/2"></div>
      )}

      <div className="relative flex justify-center">
        <div className={node.isAssistant && showChildren ? 'mr-48' : ''}>
          {node.isAssistant && showChildren && (
            <div className="absolute top-1/2 right-full w-12 border-t-2 border-gray-600 -translate-y-1/2"></div>
          )}
          <NodeCard node={node} path={path} onNodeClick={onNodeClick} onToggleCollapse={onToggleCollapse} />
        </div>
        
        {node.isAssistant && showChildren && (
           <div className="absolute top-0 right-[calc(100%+3rem)] w-0.5 h-full bg-gray-600"></div>
        )}

        {showChildren && sideStaff.length > 0 && (
          <div className="absolute top-1/2 w-[800px] h-0 border-t-2 border-gray-600 -translate-y-1/2 left-1/2 -translate-x-1/2 z-[-1] pointer-events-none">
             {sideStaff.map((staff, idx) => {
               const staffIndex = node.children!.findIndex(c => c.id === staff.id);
               const isLeft = idx % 2 === 0;
               return (
                 <div key={staff.id} className={`absolute top-0 ${isLeft ? 'right-full mr-12' : 'left-full ml-12'} -translate-y-1/2 flex flex-col items-center pointer-events-auto`}>
                    <div className="w-12 border-t-2 border-gray-600 absolute top-1/2 -translate-y-1/2 -right-12" style={staff.isDashedLine ? { borderTopStyle: 'dashed' } : {}}></div>
                    <OrgNodeRenderer node={staff} path={[...path, staffIndex]} onNodeClick={onNodeClick} onToggleCollapse={onToggleCollapse} />
                 </div>
               )
             })}
          </div>
        )}
      </div>

      {showChildren && standardChildren.length > 0 && (
        <div className="flex flex-row-reverse gap-4 mt-12 relative">
          <div className={`absolute left-1/2 w-0.5 bg-gray-600 -translate-x-1/2 -top-12 h-12 ${node.isAssistant ? 'hidden' : ''}`}></div>
          
          {node.isAssistant && (
            <div className="absolute right-[calc(50%+6rem)] w-0.5 bg-gray-600 -top-12 h-12"></div>
          )}
          
          {standardChildren.length > 1 && (
             <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-600 mx-[4.5rem]"></div>
          )}
          
          {standardChildren.map((child) => {
             const childIndex = node.children!.findIndex(c => c.id === child.id);
             const isFirst = child === standardChildren[0];
             const isLast = child === standardChildren[standardChildren.length - 1];
             
             return (
               <div key={child.id} className="relative">
                 {isFirst && standardChildren.length > 1 && (
                   <div className="absolute top-0 right-1/2 w-1/2 h-0.5 bg-[#f9fafb] translate-x-full mr-[1px] z-[1]"></div>
                 )}
                 {isLast && standardChildren.length > 1 && (
                   <div className="absolute top-0 left-1/2 w-1/2 h-0.5 bg-[#f9fafb] -translate-x-full -ml-[1px] z-[1]"></div>
                 )}
                 <OrgNodeRenderer node={child} path={[...path, childIndex]} onNodeClick={onNodeClick} onToggleCollapse={onToggleCollapse} />
               </div>
             )
          })}
        </div>
      )}
    </div>
  );
};

export const AutoOrgChart: React.FC<AutoOrgChartProps> = ({ data, onChange }) => {
  const [selectedNode, setSelectedNode] = useState<{node: TreeNode, path: number[]} | null>(null);

  const handleUpdate = (path: number[], newProps: Partial<TreeNode>) => {
    onChange(updateNodeAtPath(data, path, newProps));
  };

  const handleAddChild = (path: number[], childProps: Partial<TreeNode>) => {
    onChange(addChildAtPath(data, path, childProps));
  };

  const handleAddSibling = (path: number[], position: 'before' | 'after', childProps: Partial<TreeNode>) => {
    onChange(addSibling(data, path, position, childProps));
  };

  const handleDelete = (path: number[]) => {
    const newData = deleteNodeAtPath(data, path);
    if (newData) onChange(newData);
  };

  const handleToggleCollapse = (e: React.MouseEvent, path: number[], isCollapsed: boolean) => {
    e.preventDefault();
    onChange(updateNodeAtPath(data, path, { isCollapsed }));
  };

  return (
    <div className="w-full h-full bg-[#f9fafb] overflow-hidden flex flex-col relative" dir="rtl">
      <div className="absolute top-4 left-4 z-10 bg-white p-3 rounded-lg shadow-md border text-sm text-gray-700 font-bold opacity-80 pointer-events-none">
        💡 يمكنك سحب الشاشة بالماوس وتكبيرها واستخدام العجلة.
        <br/>
        🖱️ اضغط على أي وظيفة للتعديل عليها مباشرة!
      </div>
      
      <TransformWrapper
        initialScale={0.75}
        minScale={0.1}
        maxScale={3}
        centerOnInit={true}
        limitToBounds={false}
        wheel={{ step: 0.1 }}
        panning={{ velocityDisabled: true }}
      >
        <ChartControls />
        <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
          <div className="p-32 w-max min-w-full flex justify-center items-start min-h-full">
            <OrgNodeRenderer 
              node={data} 
              path={[]} 
              isRoot={true} 
              onNodeClick={(node, path) => setSelectedNode({node, path})} 
              onToggleCollapse={handleToggleCollapse}
            />
          </div>
        </TransformComponent>
      </TransformWrapper>

      {selectedNode && (
        <EditNodeModal
          node={selectedNode.node}
          path={selectedNode.path}
          onClose={() => setSelectedNode(null)}
          onUpdate={handleUpdate}
          onAddChild={handleAddChild}
          onAddSibling={handleAddSibling}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};
