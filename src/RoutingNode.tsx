import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const RoutingNode = ({ selected }: any) => {
  return (
    <div className={`hide-on-export group relative w-6 h-6 rounded-full border-[2px] shadow-sm transition-all flex items-center justify-center ${selected ? 'border-blue-500 bg-blue-100 ring-2 ring-blue-500' : 'border-gray-500 bg-white hover:bg-gray-100'}`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-gray-400 border-1 border-white" />
      <Handle type="target" position={Position.Left} id="left-target" className="w-2 h-2 bg-gray-400 border-1 border-white" />
      <Handle type="target" position={Position.Right} id="right-target" className="w-2 h-2 bg-gray-400 border-1 border-white" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="w-2 h-2 bg-gray-400 border-1 border-white" />
      
      <div className={`w-2 h-2 rounded-full ${selected ? 'bg-blue-600' : 'bg-gray-500'}`} />

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-blue-500 border-1 border-white" />
      <Handle type="source" position={Position.Left} id="left-source" className="w-2 h-2 bg-blue-500 border-1 border-white" />
      <Handle type="source" position={Position.Right} id="right-source" className="w-2 h-2 bg-blue-500 border-1 border-white" />
      <Handle type="source" position={Position.Top} id="top-source" className="w-2 h-2 bg-blue-500 border-1 border-white" />
    </div>
  );
};

export default memo(RoutingNode);
