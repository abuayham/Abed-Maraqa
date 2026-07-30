import { memo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';

const COLORS: Record<string, { bg: string, text: string }> = {
  'green-dark': { bg: '#547f59', text: '#ffffff' },
  'green-light': { bg: '#8fbc66', text: '#ffffff' },
  'orange': { bg: '#ef8e60', text: '#ffffff' },
  'orange-light': { bg: '#f4bc9e', text: '#1f2937' },
  'blue-light': { bg: '#9ec2ce', text: '#1f2937' },
  'teal': { bg: '#5c9fa4', text: '#ffffff' },
  'peach': { bg: '#fcdcd1', text: '#1f2937' },
};

const CustomOrgNode = ({ data, selected }: any) => {
  const colorId = data.color || 'blue-light';
  const colorStyles = COLORS[colorId] || COLORS['blue-light'];
  const fontSize = data.fontSize || 14;

  return (
    <>
      <NodeResizer 
        color="#3b82f6"
        isVisible={selected} 
        minWidth={50} 
        minHeight={50} 
        handleClassName="hide-on-export !w-3 !h-3 !rounded-full !bg-white !border-2 !border-blue-500" 
        lineClassName="hide-on-export !border-blue-500" 
      />
      <div 
        className={`group shadow-lg border-[3px] rounded-lg p-2 text-center w-full h-full flex flex-col items-center justify-center transition-all overflow-hidden break-words ${selected ? 'ring-4 ring-blue-500 border-white' : 'border-white hover:shadow-xl'}`}
        style={{ 
          backgroundColor: colorStyles.bg, 
          color: data.textColor || colorStyles.text, 
          fontSize: `${fontSize}px`,
          fontWeight: data.isBold === false ? 'normal' : 'bold',
          minWidth: '50px',
          minHeight: '50px'
        }}
        dir="rtl"
      >
        <Handle type="target" position={Position.Top} id="top-target" className="hide-on-export w-3 h-3 bg-gray-400 border-2 border-white" />
        <Handle type="target" position={Position.Left} id="left-target" className="hide-on-export w-3 h-3 bg-gray-400 border-2 border-white" />
        <Handle type="target" position={Position.Right} id="right-target" className="hide-on-export w-3 h-3 bg-gray-400 border-2 border-white" />
        <Handle type="target" position={Position.Bottom} id="bottom-target" className="hide-on-export w-3 h-3 bg-gray-400 border-2 border-white" />
        
        <div className="w-full h-full flex items-center justify-center overflow-hidden text-ellipsis leading-tight">
          {data.label}
        </div>

        <Handle type="source" position={Position.Bottom} id="bottom-source" className="hide-on-export w-3 h-3 bg-blue-500 border-2 border-white" />
        <Handle type="source" position={Position.Left} id="left-source" className="hide-on-export w-3 h-3 bg-blue-500 border-2 border-white" />
        <Handle type="source" position={Position.Right} id="right-source" className="hide-on-export w-3 h-3 bg-blue-500 border-2 border-white" />
        <Handle type="source" position={Position.Top} id="top-source" className="hide-on-export w-3 h-3 bg-blue-500 border-2 border-white" />
      </div>
    </>
  );
};

export default memo(CustomOrgNode);
