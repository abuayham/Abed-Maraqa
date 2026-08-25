import { useState } from 'react';
import { Network, LayoutTemplate, MousePointer2, FileText, Home as HomeIcon } from 'lucide-react';
import { ReactFlowChart } from './ReactFlowChart';
import { AutoLayoutChart } from './AutoLayoutChart';
import { ReportsTab } from './ReportsTab';
import { Home } from './Home';

function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'free' | 'auto' | 'reports'>('home');

  if (activeTab === 'home') {
    return <Home onSelectTab={setActiveTab} />;
  }

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
          
          <div className="flex items-center gap-6">
            
            {/* Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('free')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${
                  activeTab === 'free' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MousePointer2 size={16} />
                التصميم الحر
              </button>
              <button
                onClick={() => setActiveTab('auto')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${
                  activeTab === 'auto' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutTemplate size={16} />
                التصميم التلقائي
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${
                  activeTab === 'reports' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText size={16} />
                التقارير والملفات
              </button>
              <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
              <button
                onClick={() => setActiveTab('home')}
                className="flex items-center justify-center p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors"
                title="الرئيسية"
              >
                <HomeIcon size={18} />
              </button>
            </div>

            {activeTab !== 'reports' && (
              <>
                <div className="w-px h-8 bg-gray-200"></div>

                <div className="text-sm font-bold text-gray-600">إضافة:</div>
                
                {/* Draggable Rectangle */}
                <div 
                  className={`bg-white border-2 border-blue-500 rounded-md px-4 py-2 text-sm font-bold flex items-center gap-2 ${activeTab === 'free' ? 'cursor-grab shadow-sm hover:shadow-md' : 'opacity-50 cursor-not-allowed'}`}
                  draggable={activeTab === 'free'}
                  onDragStart={(e) => {
                    if (activeTab !== 'free') return;
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
                  className={`bg-white border-2 border-gray-500 rounded-full w-10 h-10 flex items-center justify-center ${activeTab === 'free' ? 'cursor-grab shadow-sm hover:shadow-md' : 'opacity-50 cursor-not-allowed'}`}
                  draggable={activeTab === 'free'}
                  title="مفصل أسهم (لتفرع الخطوط)"
                  onDragStart={(e) => {
                    if (activeTab !== 'free') return;
                    e.dataTransfer.setData('application/reactflow', 'routingNode');
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                >
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                </div>
              </>
            )}
            
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full h-[calc(100vh-64px)] relative">
        {activeTab === 'free' && <ReactFlowChart />}
        {activeTab === 'auto' && <AutoLayoutChart />}
        {activeTab === 'reports' && <ReportsTab />}
      </main>
    </div>
  );
}

export default App;
