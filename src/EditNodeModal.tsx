import React, { useState } from 'react';
import type { TreeNode } from './data';
import { X, Save, Trash2, PlusCircle, Settings, Palette, ArrowRightToLine, ArrowLeftToLine } from 'lucide-react';

interface EditNodeModalProps {
  node: TreeNode;
  path: number[];
  onClose: () => void;
  onUpdate: (path: number[], newProps: Partial<TreeNode>) => void;
  onAddChild: (path: number[], childProps: Partial<TreeNode>) => void;
  onAddSibling: (path: number[], position: 'before' | 'after', childProps: Partial<TreeNode>) => void;
  onDelete: (path: number[]) => void;
}

const COLORS = [
  { id: 'green-dark', name: 'أخضر غامق (رئيسي)', hex: '#15803d' },
  { id: 'green-light', name: 'أخضر فاتح', hex: '#80b157' },
  { id: 'orange', name: 'برتقالي (نواب)', hex: '#ee8354' },
  { id: 'orange-light', name: 'برتقالي فاتح', hex: '#f5b89a' },
  { id: 'blue-light', name: 'أزرق (عمداء)', hex: '#87c6cf' },
  { id: 'teal', name: 'أخضر مزرق', hex: '#4da8b0' },
  { id: 'peach', name: 'خوخي (مراكز)', hex: '#fad3c6' },
];

export const EditNodeModal: React.FC<EditNodeModalProps> = ({ node, path, onClose, onUpdate, onAddChild, onAddSibling, onDelete }) => {
  const [title, setTitle] = useState(node.title);
  const [color, setColor] = useState(node.color || 'blue-light');
  const [isAssistant, setIsAssistant] = useState(!!node.isAssistant);
  const [isSideStaff, setIsSideStaff] = useState(!!node.isSideStaff);
  const [isDashedLine, setIsDashedLine] = useState(!!node.isDashedLine);

  const handleSave = () => {
    onUpdate(path, { title, color, isAssistant, isSideStaff, isDashedLine });
    onClose();
  };

  const isRoot = path.length === 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center rtl p-4" dir="rtl">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="text-blue-500" size={20} />
            تعديل خصائص الوظيفة
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">المسمى الوظيفي</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              autoFocus
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <Palette size={16} /> لون المستطيل
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  title={c.name}
                  className={`h-8 rounded-md border-2 transition-all ${color === c.id ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          {/* Layout Options (Not for root) */}
          {!isRoot && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col gap-3">
              <h3 className="text-sm font-bold text-gray-700 mb-1">خيارات التخطيط والرسم (Auto-Layout)</h3>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={isAssistant} onChange={(e) => setIsAssistant(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                <div>
                  <span className="block text-sm font-medium text-gray-800">وظيفة "مساعد" (Assistant)</span>
                  <span className="block text-xs text-gray-500">تظهر متدلية على جانب الخط العمودي الرئيسي.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={isSideStaff} onChange={(e) => setIsSideStaff(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                <div>
                  <span className="block text-sm font-medium text-gray-800">هيئة استشارية جانية (Side Staff)</span>
                  <span className="block text-xs text-gray-500">تظهر بشكل أفقي على يمين أو يسار الخط.</span>
                </div>
              </label>

              {isSideStaff && (
                <label className="flex items-center gap-3 cursor-pointer pl-6">
                  <input type="checkbox" checked={isDashedLine} onChange={(e) => setIsDashedLine(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm font-medium text-gray-800">رسم خط متقطع (علاقة استشارية)</span>
                </label>
              )}
            </div>
          )}
          
          <div className="border-t border-gray-100 pt-4 mt-2">
             <h3 className="text-sm font-bold text-gray-700 mb-3">خيارات الإضافة</h3>
             <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    onAddChild(path, { color: 'blue-light' });
                    onClose();
                  }}
                  className="flex flex-1 justify-center items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition text-sm font-bold"
                >
                  <PlusCircle size={16} /> إضافة قسم تحته
                </button>
                {!isRoot && (
                  <>
                    <button
                      onClick={() => {
                        onAddSibling(path, 'before', { color: 'blue-light' });
                        onClose();
                      }}
                      className="flex flex-1 justify-center items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition text-sm font-bold"
                    >
                      <ArrowRightToLine size={16} /> قسم يسبقه
                    </button>
                    <button
                      onClick={() => {
                        onAddSibling(path, 'after', { color: 'blue-light' });
                        onClose();
                      }}
                      className="flex flex-1 justify-center items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition text-sm font-bold"
                    >
                      <ArrowLeftToLine size={16} /> قسم يليه
                    </button>
                  </>
                )}
             </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-2 justify-between">
          <div>
            {!isRoot && (
              <button
                onClick={() => {
                  if(window.confirm('هل أنت متأكد من حذف هذه الوظيفة مع جميع فروعها؟')) {
                    onDelete(path);
                    onClose();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition text-sm font-bold"
              >
                <Trash2 size={16} /> حذف الوظيفة بالكامل
              </button>
            )}
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md text-sm font-bold"
          >
            <Save size={16} /> حفظ التعديلات
          </button>
        </div>
      </div>
    </div>
  );
};
