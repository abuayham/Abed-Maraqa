import React, { useState } from 'react';
import type { TreeNode } from './data';
import { ChevronRight, ChevronDown, Plus, Trash2, Edit2, Check, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { updateNodeAtPath, addChildAtPath, deleteNodeAtPath, moveNode } from './treeUtils';

interface TreeViewProps {
  data: TreeNode;
  onChange: (newData: TreeNode) => void;
}

const TreeItem = ({
  node,
  path,
  isFirst,
  isLast,
  onUpdate,
  onAddChild,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop
}: {
  node: TreeNode;
  path: number[];
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (path: number[], newTitle: string) => void;
  onAddChild: (path: number[]) => void;
  onDelete: (path: number[]) => void;
  onMoveUp: (path: number[]) => void;
  onMoveDown: (path: number[]) => void;
  onDragStart: (e: React.DragEvent, path: number[]) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, path: number[]) => void;
}) => {
  const [expanded, setExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.title);
  const hasChildren = node.children && node.children.length > 0;
  const isRoot = path.length === 0;

  const handleSave = () => {
    onUpdate(path, editValue);
    setIsEditing(false);
  };

  return (
    <div className="ml-4 rtl:ml-0 rtl:mr-4 select-none">
      <div 
        className="flex items-center gap-2 py-2 hover:bg-gray-100 rounded group transition px-2"
        draggable={!isRoot}
        onDragStart={(e) => onDragStart(e, path)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, path)}
      >
        {!isRoot && (
          <div className="cursor-grab text-gray-300 hover:text-gray-500 hidden group-hover:block transition" title="اسحب لنقل الوظيفة">
            <GripVertical size={16} />
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-800 ${!hasChildren && 'opacity-0'}`}
        >
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="border border-blue-400 rounded px-3 py-1 text-base w-full outline-none focus:ring-2 focus:ring-blue-200"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button onClick={handleSave} className="text-green-600 p-2 hover:bg-green-50 rounded bg-white border border-green-200">
              <Check size={16} />
            </button>
          </div>
        ) : (
          <span 
            className="text-base font-medium text-gray-700 flex-1 cursor-pointer py-1"
            onDoubleClick={() => setIsEditing(true)}
          >
            {node.title}
          </span>
        )}

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          {!isRoot && (
            <>
              <button onClick={() => !isFirst && onMoveUp(path)} className={`p-1.5 rounded ${isFirst ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'}`} title="نقل للأعلى" disabled={isFirst}>
                <ArrowUp size={16} />
              </button>
              <button onClick={() => !isLast && onMoveDown(path)} className={`p-1.5 rounded ${isLast ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'}`} title="نقل للأسفل" disabled={isLast}>
                <ArrowDown size={16} />
              </button>
            </>
          )}
          <div className="w-px h-4 bg-gray-300 mx-1"></div>
          <button onClick={() => setIsEditing(true)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="تعديل">
            <Edit2 size={16} />
          </button>
          <button onClick={() => { setExpanded(true); onAddChild(path); }} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="إضافة قسم فرعي">
            <Plus size={16} />
          </button>
          {!isRoot && (
            <button onClick={() => { if(window.confirm('هل أنت متأكد من الحذف؟')) onDelete(path) }} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="حذف">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
      
      {expanded && hasChildren && (
        <div className="border-r-2 border-gray-100 pr-2 mr-3 mt-1 pb-2">
          {node.children!.map((child, idx) => (
            <TreeItem
              key={child.id}
              node={child}
              path={[...path, idx]}
              isFirst={idx === 0}
              isLast={idx === node.children!.length - 1}
              onUpdate={onUpdate}
              onAddChild={onAddChild}
              onDelete={onDelete}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const TreeView: React.FC<TreeViewProps> = ({ data, onChange }) => {
  const [draggedPath, setDraggedPath] = useState<number[] | null>(null);

  const handleUpdate = (path: number[], newTitle: string) => {
    onChange(updateNodeAtPath(data, path, { title: newTitle }));
  };

  const handleAddChild = (path: number[]) => {
    onChange(addChildAtPath(data, path));
  };

  const handleDelete = (path: number[]) => {
    if (path.length === 0) return; // Cannot delete root
    const newData = deleteNodeAtPath(data, path);
    if (newData) onChange(newData);
  };

  const handleMoveUp = (path: number[]) => {
    if (path.length === 0) return;
    const parentPath = path.slice(0, -1);
    const index = path[path.length - 1];
    if (index > 0) {
      const newData = moveNode(data, path, parentPath, index - 1);
      onChange(newData);
    }
  };

  const handleMoveDown = (path: number[]) => {
    if (path.length === 0) return;
    const parentPath = path.slice(0, -1);
    const index = path[path.length - 1];
    // moveNode will insert at index + 1 effectively pushing it down
    const newData = moveNode(data, path, parentPath, index + 2);
    onChange(newData);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, path: number[]) => {
    setDraggedPath(path);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(path)); // required for firefox
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetPath: number[]) => {
    e.preventDefault();
    if (!draggedPath) return;
    
    // Move dragged node to become a child of targetPath
    const newData = moveNode(data, draggedPath, targetPath);
    if (newData !== data) { // if move was valid
      onChange(newData);
    }
    setDraggedPath(null);
  };

  return (
    <div className="w-full bg-white h-full flex flex-col z-20">
      <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
        <h2 className="font-bold text-xl text-gray-800">قائمة الوظائف الهرمية</h2>
        <span className="text-sm text-gray-500">💡 يمكنك الإمساك بأي وظيفة وسحبها وإفلاتها لنقلها!</span>
      </div>
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar text-lg" dir="rtl">
        <TreeItem
          node={data}
          path={[]}
          isFirst={true}
          isLast={true}
          onUpdate={handleUpdate}
          onAddChild={handleAddChild}
          onDelete={handleDelete}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      </div>
    </div>
  );
};
