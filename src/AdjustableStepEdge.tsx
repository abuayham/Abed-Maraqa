import { BaseEdge, EdgeLabelRenderer, Position, useReactFlow } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { useCallback } from 'react';

export default function AdjustableStepEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  style,
  markerEnd,
  data,
  selected
}: EdgeProps) {
  const { setEdges, screenToFlowPosition } = useReactFlow();
  
  // Determine dominant flow direction based on source handle position
  const isVerticalFlow = sourcePosition === Position.Top || sourcePosition === Position.Bottom;
  
  let path = '';
  let handleX = 0;
  let handleY = 0;
  let cursor = 'cursor-ns-resize';

  if (isVerticalFlow) {
    const splitY = (data?.splitY !== undefined && data?.splitY !== null) ? Number(data.splitY) : (sourceY + targetY) / 2;
    path = `M ${sourceX} ${sourceY} L ${sourceX} ${splitY} L ${targetX} ${splitY} L ${targetX} ${targetY}`;
    handleX = (sourceX + targetX) / 2;
    handleY = splitY;
  } else {
    const splitX = (data?.splitX !== undefined && data?.splitX !== null) ? Number(data.splitX) : (sourceX + targetX) / 2;
    path = `M ${sourceX} ${sourceY} L ${splitX} ${sourceY} L ${splitX} ${targetY} L ${targetX} ${targetY}`;
    handleX = splitX;
    handleY = (sourceY + targetY) / 2;
    cursor = 'cursor-ew-resize';
  }
  
  const handleDrag = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const position = screenToFlowPosition({ x: moveEvent.clientX, y: moveEvent.clientY });
      setEdges((edges) =>
        edges.map((edge) => {
          if (edge.id === id) {
            return {
              ...edge,
              data: {
                ...edge.data,
                ...(isVerticalFlow ? { splitY: position.y } : { splitX: position.x }),
              },
            };
          }
          return edge;
        })
      );
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [id, setEdges, screenToFlowPosition, isVerticalFlow]);

  return (
    <>
      <BaseEdge path={path} markerEnd={markerEnd} style={{...style, strokeWidth: selected ? 4 : (style?.strokeWidth || 2), stroke: selected ? '#3b82f6' : (style?.stroke || '#000')}} />
      {selected && (
        <EdgeLabelRenderer>
          <div
            className={`nodrag nopan absolute hide-on-export ${cursor}`}
            style={{
              transform: `translate(-50%, -50%) translate(${handleX}px, ${handleY}px)`,
              pointerEvents: 'all',
              zIndex: 1000,
            }}
            onMouseDown={handleDrag}
          >
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow hover:scale-125 transition-transform" title="اسحب لتغيير مسار السهم" />
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
