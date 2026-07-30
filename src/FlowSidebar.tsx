import React from 'react';

const FlowSidebar = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string, color: string, title: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/nodecolor', color);
    event.dataTransfer.setData('application/nodetitle', title);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 bg-white border-l h-full flex flex-col shadow-sm flex-shrink-0 z-20" dir="rtl">
      <div className="p-6 border-b bg-gray-50">
        <h2 className="font-bold text-xl text-gray-800">قائمة الوظائف</h2>
        <p className="text-sm text-gray-500 mt-2">اسحب الوظيفة وأفلتها في اللوحة</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        
        <div 
          className="bg-[#15803d] text-white p-3 text-center rounded-md cursor-grab shadow-sm border-2 border-white hover:scale-105 transition"
          onDragStart={(event) => onDragStart(event, 'orgNode', 'green-dark', 'مجلس / رئيس')}
          draggable
        >
          مجلس / رئيس (أخضر غامق)
        </div>

        <div 
          className="bg-[#80b157] text-white p-3 text-center rounded-md cursor-grab shadow-sm border-2 border-white hover:scale-105 transition"
          onDragStart={(event) => onDragStart(event, 'orgNode', 'green-light', 'مساعد')}
          draggable
        >
          مساعد (أخضر فاتح)
        </div>

        <div 
          className="bg-[#ee8354] text-white p-3 text-center rounded-md cursor-grab shadow-sm border-2 border-white hover:scale-105 transition"
          onDragStart={(event) => onDragStart(event, 'orgNode', 'orange', 'نائب رئيس')}
          draggable
        >
          نائب رئيس (برتقالي)
        </div>
        
        <div 
          className="bg-[#f5b89a] text-gray-800 p-3 text-center rounded-md cursor-grab shadow-sm border-2 border-white hover:scale-105 transition"
          onDragStart={(event) => onDragStart(event, 'orgNode', 'orange-light', 'مساعد نائب')}
          draggable
        >
          مساعد نائب (برتقالي فاتح)
        </div>

        <div 
          className="bg-[#87c6cf] text-gray-800 p-3 text-center rounded-md cursor-grab shadow-sm border-2 border-white hover:scale-105 transition"
          onDragStart={(event) => onDragStart(event, 'orgNode', 'blue-light', 'عميد / مدير')}
          draggable
        >
          عميد / مدير (أزرق)
        </div>

        <div 
          className="bg-[#fad3c6] text-gray-800 p-3 text-center rounded-md cursor-grab shadow-sm border-2 border-white hover:scale-105 transition"
          onDragStart={(event) => onDragStart(event, 'orgNode', 'peach', 'مركز / إدارة')}
          draggable
        >
          مركز / إدارة (خوخي)
        </div>

        <div 
          className="bg-[#fcdcd1] text-gray-800 p-3 text-center rounded-md cursor-grab shadow-sm border-2 border-white hover:scale-105 transition"
          onDragStart={(event) => onDragStart(event, 'orgNode', 'peach', 'مدير مركز / أمين')}
          draggable
        >
          مدير مركز / أمين (خوخي)
        </div>

      </div>
    </aside>
  );
};

export default FlowSidebar;
