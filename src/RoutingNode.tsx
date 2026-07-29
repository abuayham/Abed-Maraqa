import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const RoutingNode = ({ selected }: any) => {
  return (
    <div className="relative w-4 h-4 flex items-center justify-center bg-transparent z-50 cursor-grab">
      {/* النقطة المرئية التي تختفي عند التصدير */}
      <div className={`hide-on-export w-3 h-3 rounded-full ${selected ? 'bg-blue-600 ring-4 ring-blue-300' : 'bg-black'}`} />
      
      {/* مقبض الاستقبال (Target) */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-8 !h-8 !opacity-0 !border-0 !bg-transparent !z-0 !min-w-0 !min-h-0" 
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      />
      
      {/* مقبض الإرسال (Source) */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-4 !h-4 !opacity-0 !border-0 !bg-transparent !z-10 !min-w-0 !min-h-0 cursor-crosshair" 
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      />
    </div>
  );
};

export default memo(RoutingNode);
