import { useState, useEffect, useRef } from 'react';
import FlowChart, { getLayoutedElements } from './FlowChart';
import type { OrgNode } from './data';
import { Download, CheckCircle2, RefreshCw, ChevronDown, FileImage, Settings2, X, AlertTriangle } from 'lucide-react';
import { supabase } from './supabase';
import { exportToImage } from './exportUtils';
import type { Node, Edge } from '@xyflow/react';
import { initialData } from './data';

const DEFAULT_NODES: Node[] = [
  { id: 'root', type: 'orgNode', position: { x: 300, y: 100 }, data: { title: 'رئيس الجامعة', color: 'green-dark' } }
];

function App() {
  const [nodes, setNodes] = useState<Node[]>(DEFAULT_NODES);
  const [edges, setEdges] = useState<Edge[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    lineThickness: 2,
    lineColor: '#374151',
    fontSizeOffset: 0,
    showArrows: false
  });

  const isInitialLoad = useRef(true);
  const saveTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    fetchData();
    // Load local settings
    const s = localStorage.getItem('orgSettings');
    if (s) setSettings(JSON.parse(s));
  }, []);

  // Save settings to local storage when they change
  useEffect(() => {
    localStorage.setItem('orgSettings', JSON.stringify(settings));
  }, [settings]);

  // Auto-save effect
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    
    setSaveStatus('saving');
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    
    saveTimeout.current = setTimeout(() => {
      saveDataToDb(nodes, edges);
    }, 1500);

    return () => clearTimeout(saveTimeout.current);
  }, [nodes, edges]);

  const convertLegacyData = (orgNode: OrgNode) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    const traverse = (node: OrgNode, parentId?: string, isRightStaff?: boolean, isLeftStaff?: boolean, isSibling?: boolean) => {
      newNodes.push({
        id: node.id,
        type: 'orgNode',
        position: { x: Math.random() * 200, y: Math.random() * 200 },
        data: { title: node.title, color: node.color, textAlign: node.textAlign }
      });
      
      if (parentId) {
        newEdges.push({
          id: `e-${parentId}-${node.id}`,
          source: parentId,
          target: node.id,
          sourceHandle: isSibling ? 'left' : isRightStaff ? 'right' : (isLeftStaff ? 'left' : undefined),
          type: 'orgEdge',
          style: { strokeDasharray: node.lineStyle === 'dashed' ? '5,5' : 'none' },
        });
      }

      node.children?.forEach(c => traverse(c, node.id));
      node.rightStaff?.forEach(c => traverse(c, node.id, true));
      node.leftStaff?.forEach(c => traverse(c, node.id, false, true));
      if (node.leftSibling) traverse(node.leftSibling, node.id, false, false, true);
    };
    
    traverse(orgNode);
    const result = getLayoutedElements(newNodes, newEdges);
    console.log("convertLegacyData result:", result);
    return result;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: orgData, error } = await supabase
        .from('org_chart')
        .select('data')
        .eq('id', 1)
        .single();
      
      if (error) {
        console.error('Error fetching data:', error);
        // Fallback to initialData from data.ts if db is empty
        isInitialLoad.current = true;
        try {
          const { nodes: n, edges: e } = convertLegacyData(initialData);
          setNodes(n);
          setEdges(e);
        } catch (e) {
          console.error('Migration of initialData failed', e);
        }
      } else if (orgData && orgData.data) {
        isInitialLoad.current = true;
        if (orgData.data.nodes && orgData.data.nodes.length > 0) {
          setNodes(orgData.data.nodes);
          setEdges(orgData.data.edges || []);
        } else if (orgData.data.title || orgData.data.id) {
          // Legacy conversion
          try {
            const { nodes: n, edges: e } = convertLegacyData(orgData.data);
            if (n.length > 0) {
              setNodes(n);
              setEdges(e);
            }
          } catch (e) {
            console.error('Migration failed', e);
          }
        } else {
          // DB has an empty object or invalid data
          const { nodes: n, edges: e } = convertLegacyData(initialData);
          setNodes(n);
          setEdges(e);
        }
      } else {
        // Fallback if no orgData
        isInitialLoad.current = true;
        const { nodes: n, edges: e } = convertLegacyData(initialData);
        setNodes(n);
        setEdges(e);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      // Fallback if completely failed
      isInitialLoad.current = true;
      try {
        const { nodes: n, edges: e } = convertLegacyData(initialData);
        setNodes(n);
        setEdges(e);
      } catch (e) {
        console.error('Migration failed in catch block', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveDataToDb = async (currNodes: Node[], currEdges: Edge[]) => {
    try {
      const { error } = await supabase
        .from('org_chart')
        .upsert({ id: 1, data: { nodes: currNodes, edges: currEdges } });
      
      if (error) {
        setSaveStatus('error');
        console.error(error);
      } else {
        setSaveStatus('saved');
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  const handleUpdateData = (newNodes: Node[], newEdges: Edge[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
  };

  const exportToJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ nodes, edges }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "org-chart-data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setExportMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans" style={{
      '--line-thickness': `${settings.lineThickness}px`,
      '--line-color': settings.lineColor,
      '--font-size-offset': `${settings.fontSizeOffset}px`
    } as any}>
      <div className={settings.showArrows ? 'show-arrows' : ''}>
      <header className="bg-white shadow-sm p-4 flex justify-between items-center z-10 sticky top-0 border-b">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">الهيكل التنظيمي الاحترافي</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500">متصل بـ Supabase (عقد: {nodes.length})</p>
            <span className="text-xs text-gray-400">|</span>
            <div className={`text-xs flex items-center gap-1 font-medium ${
              saveStatus === 'saved' ? 'text-green-600' : 
              saveStatus === 'error' ? 'text-red-500' : 'text-orange-500'
            }`}>
              {saveStatus === 'saved' && <><CheckCircle2 size={12}/> تم الحفظ</>}
              {saveStatus === 'saving' && <><RefreshCw size={12} className="animate-spin"/> جاري الحفظ التلقائي...</>}
              {saveStatus === 'error' && 'فشل الحفظ'}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 relative">
          <div className="flex bg-orange-100 text-orange-700 rounded-lg p-1.5 px-3 items-center gap-2 text-sm font-bold shadow-sm border border-orange-200">
            <AlertTriangle size={16}/> وضع الرسم الحر التفاعلي
          </div>
          
          <button 
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
            title="إعدادات المظهر"
          >
            <Settings2 size={18} /> المظهر
          </button>
          
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
            title="إعادة تحميل البيانات"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-org-dark-green text-white rounded hover:bg-green-800 transition shadow"
            >
              <Download size={18} /> تصدير <ChevronDown size={16} />
            </button>
            
            {exportMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden py-1 z-50">
                <button onClick={() => { exportToImage('org-chart-container'); setExportMenuOpen(false); }} className="w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3"><FileImage size={16} className="text-blue-500"/> صورة (PNG)</button>
                <div className="h-px bg-gray-100 my-1"/>
                <button onClick={exportToJson} className="w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-600">نسخة احتياطية (JSON)</button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="w-full h-[calc(100vh-70px)] overflow-hidden relative" onClick={() => setExportMenuOpen(false)}>
        <div id="org-chart-container" className="w-full h-full org-chart-wrapper relative">
           {loading ? (
             <div className="flex justify-center items-center h-full text-gray-500">جاري التحميل...</div>
           ) : (
             <FlowChart initialNodes={nodes} initialEdges={edges} onSave={handleUpdateData} />
           )}
        </div>
      </main>

      {/* Settings Sidebar */}
      {settingsOpen && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl border-l border-gray-200 z-[300] p-6 flex flex-col" dir="rtl">
          <div className="flex justify-between items-center mb-8 border-b pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><Settings2 size={24} className="text-blue-600"/> إعدادات المظهر</h2>
            <button onClick={() => setSettingsOpen(false)} className="text-gray-400 hover:text-gray-800 transition"><X size={24}/></button>
          </div>
          
          <div className="space-y-6 flex-1 overflow-auto pr-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">سُمك الخطوط الرابطة ({settings.lineThickness}px)</label>
              <input type="range" min="1" max="6" value={settings.lineThickness} onChange={e => setSettings({ ...settings, lineThickness: parseInt(e.target.value) })} className="w-full accent-blue-600" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">لون الخطوط الرابطة</label>
              <div className="flex gap-2">
                {['#374151', '#2563eb', '#16a34a', '#dc2626', '#9333ea'].map(color => (
                  <button key={color} onClick={() => setSettings({ ...settings, lineColor: color })} className={`w-8 h-8 rounded-full border-2 transition-all ${settings.lineColor === color ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">حجم الخط ({settings.fontSizeOffset > 0 ? '+' : ''}{settings.fontSizeOffset})</label>
              <input type="range" min="-4" max="8" step="1" value={settings.fontSizeOffset} onChange={e => setSettings({ ...settings, fontSizeOffset: parseInt(e.target.value) })} className="w-full accent-blue-600" />
            </div>

            <div>
              <label className="flex items-center gap-3 text-sm font-semibold text-gray-700 cursor-pointer">
                <input type="checkbox" checked={settings.showArrows} onChange={e => setSettings({ ...settings, showArrows: e.target.checked })} className="w-4 h-4 accent-blue-600 rounded" />
                إظهار الأسهم في نهاية الخطوط
              </label>
            </div>
          </div>
          
          <div className="pt-6 border-t mt-4">
            <button onClick={() => setSettings({ lineThickness: 2, lineColor: '#374151', fontSizeOffset: 0, showArrows: false })} className="w-full py-2.5 text-sm font-semibold text-gray-600 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition">إعادة ضبط المظهر</button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default App;
