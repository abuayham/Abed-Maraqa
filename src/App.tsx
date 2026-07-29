import { Network } from 'lucide-react';
import { ReactFlowChart } from './ReactFlowChart';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Network size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">نظام إدارة الهياكل التنظيمية (المتقدم)</h1>
              <p className="text-xs text-gray-500">تصميم حر واحترافي</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm font-bold text-gray-600">إضافة:</div>
            
            {/* Draggable Rectangle */}
            <div 
              className="cursor-grab bg-white border-2 border-blue-500 rounded-md px-4 py-2 text-sm font-bold shadow-sm hover:shadow-md transition-shadow text-gray-800 flex items-center gap-2"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/reactflow', 'orgNode');
                e.dataTransfer.setData('application/nodecolor', 'blue-light');
                e.dataTransfer.setData('application/nodetitle', 'مسمى وظيفي جديد');
                e.dataTransfer.effectAllowed = 'move';
              }}
            >
              <div className="w-3 h-3 bg-blue-300 rounded-sm"></div>
              وظيفة
            </div>

            {/* Draggable Routing Node */}
            <div 
              className="cursor-grab bg-white border-2 border-gray-500 rounded-full w-10 h-10 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
              draggable
              title="مفصل أسهم (لتفرع الخطوط)"
              onDragStart={(e) => {
                e.dataTransfer.setData('application/reactflow', 'routingNode');
                e.dataTransfer.effectAllowed = 'move';
              }}
            >
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            </div>
            
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full h-[calc(100vh-64px)]">
        <ReactFlowChart />
      </main>
    </div>
  );
}

export default App;
