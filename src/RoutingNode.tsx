import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const RoutingNode = ({ selected }: any) => {
  return (
    <div className={`relative w-0 h-0 flex items-center justify-center z-50`}>
      {/* النقطة المرئية التي تختفي عند التصدير */}
      <div className={`hide-on-export absolute w-2 h-2 rounded-full ${selected ? 'bg-blue-600 ring-4 ring-blue-300' : 'bg-black'}`} />
      
      {/* منطقة مخفية أوسع لتسهيل النقر والسحب */}
      <div className="absolute w-8 h-8 -left-4 -top-4 bg-transparent cursor-grab rounded-full hover:bg-gray-400/20 transition-colors z-[-1]" />
      
      {/* مقابض التوصيل الشفافة في المنتصف */}
      <Handle type="target" position={Position.Top} className="!w-6 !h-6 !opacity-0 !border-0 !bg-transparent !z-0" />
      <Handle type="target" position={Position.Left} id="left-target" className="!w-6 !h-6 !opacity-0 !border-0 !bg-transparent !z-0" />
      <Handle type="target" position={Position.Right} id="right-target" className="!w-6 !h-6 !opacity-0 !border-0 !bg-transparent !z-0" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="!w-6 !h-6 !opacity-0 !border-0 !bg-transparent !z-0" />
      
      <Handle type="source" position={Position.Bottom} className="!w-6 !h-6 !opacity-0 !border-0 !bg-transparent !z-10" />
      <Handle type="source" position={Position.Left} id="left-source" className="!w-6 !h-6 !opacity-0 !border-0 !bg-transparent !z-10" />
      <Handle type="source" position={Position.Right} id="right-source" className="!w-6 !h-6 !opacity-0 !border-0 !bg-transparent !z-10" />
      <Handle type="source" position={Position.Top} id="top-source" className="!w-6 !h-6 !opacity-0 !border-0 !bg-transparent !z-10" />
    </div>
  );
};

export default memo(RoutingNode);
