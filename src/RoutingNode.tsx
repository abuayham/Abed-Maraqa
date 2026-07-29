import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const RoutingNode = ({ selected }: any) => {
  return (
    <div className="relative w-0 h-0 flex items-center justify-center z-50">
      {/* النقطة المرئية التي تختفي عند التصدير */}
      <div 
        className={`hide-on-export absolute w-3 h-3 rounded-full ${selected ? 'bg-blue-600 ring-4 ring-blue-300' : 'bg-black'}`} 
        style={{ top: 0, left: 0, transform: 'translate(-50%, -50%)' }} 
      />
      
      {/* مقبض الاستقبال (Target) بحجم كبير 32x32 لسهولة إسقاط الأسهم عليه */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-8 !h-8 !opacity-0 !border-0 !bg-transparent !z-0 !min-w-0 !min-h-0" 
        style={{ top: 0, left: 0, transform: 'translate(-50%, -50%)' }}
      />
      
      {/* مقبض الإرسال (Source) بحجم أصغر 16x16 فوقه، لسحب أسهم جديدة منه */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-4 !h-4 !opacity-0 !border-0 !bg-transparent !z-10 !min-w-0 !min-h-0 cursor-crosshair" 
        style={{ top: 0, left: 0, transform: 'translate(-50%, -50%)' }}
      />
    </div>
  );
};

export default memo(RoutingNode);
