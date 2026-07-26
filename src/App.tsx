import { useState, useEffect, useRef } from 'react';
import { OrgChart } from './OrgChart';
import { initialData, type OrgNode } from './data';
import { Download, CheckCircle2, RefreshCw, ChevronDown, FileImage, FileText, Table, Settings2, X } from 'lucide-react';
import { supabase } from './supabase';
import { exportToImage, exportToWord, exportToExcel } from './exportUtils';

function App() {
  const [data, setData] = useState<OrgNode>(initialData);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const [history, setHistory] = useState<OrgNode[]>([]);
  const [future, setFuture] = useState<OrgNode[]>([]);
  const [settings, setSettings] = useState({
    lineThickness: 2,
    lineColor: '#374151',
    fontSizeOffset: 0,
    boxWidth: 140,
    boxPadding: 8,
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
      saveDataToDb(data);
    }, 1500);

    return () => clearTimeout(saveTimeout.current);
  }, [data]);

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
      } else if (orgData && orgData.data) {
        isInitialLoad.current = true;
        setData(orgData.data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveDataToDb = async (currentData: OrgNode) => {
    try {
      const { error } = await supabase
        .from('org_chart')
        .upsert({ id: 1, data: currentData });
      
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

  const handleUpdateData = (newData: OrgNode) => {
    setHistory(prev => [...prev, data]);
    setFuture([]);
    setData(newData);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setFuture(prev => [data, ...prev]);
    setHistory(prev => prev.slice(0, -1));
    setData(previousState);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const nextState = future[0];
    setHistory(prev => [...prev, data]);
    setFuture(prev => prev.slice(1));
    setData(nextState);
  };

  const exportToJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
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
      '--font-size-offset': `${settings.fontSizeOffset}px`,
      '--box-width': `${settings.boxWidth}px`,
      '--box-padding': `${settings.boxPadding}px`
    } as any}>
      <div className={settings.showArrows ? 'show-arrows' : ''}>
      <header className="bg-white shadow-sm p-4 flex justify-between items-center z-10 sticky top-0 border-b">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">الهيكل التنظيمي الاحترافي</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-500">متصل بـ Supabase</p>
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
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={handleUndo} disabled={history.length === 0} className="p-1.5 text-gray-600 rounded hover:bg-white disabled:opacity-30 transition" title="تراجع"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg></button>
            <button onClick={handleRedo} disabled={future.length === 0} className="p-1.5 text-gray-600 rounded hover:bg-white disabled:opacity-30 transition" title="إعادة"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg></button>
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
                <button onClick={() => { exportToWord(data); setExportMenuOpen(false); }} className="w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3"><FileText size={16} className="text-blue-700"/> ملف Word</button>
                <button onClick={() => { exportToExcel(data); setExportMenuOpen(false); }} className="w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3"><Table size={16} className="text-green-600"/> ملف Excel</button>
                <div className="h-px bg-gray-100 my-1"/>
                <button onClick={exportToJson} className="w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-600">نسخة احتياطية (JSON)</button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full overflow-auto relative" onClick={() => setExportMenuOpen(false)}>
        <div id="org-chart-container" className="min-w-max p-8 bg-[#f8f9fa] org-chart-wrapper">
           {loading ? (
             <div className="flex justify-center items-center h-64 text-gray-500">جاري التحميل...</div>
           ) : (
             <OrgChart data={data} onUpdate={handleUpdateData} />
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

            <hr className="my-4" />

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">عرض المستطيل ({settings.boxWidth}px)</label>
              <input type="range" min="80" max="250" step="5" value={settings.boxWidth} onChange={e => setSettings({ ...settings, boxWidth: parseInt(e.target.value) })} className="w-full accent-blue-600" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">التباعد الداخلي (Padding) ({settings.boxPadding}px)</label>
              <input type="range" min="2" max="24" step="2" value={settings.boxPadding} onChange={e => setSettings({ ...settings, boxPadding: parseInt(e.target.value) })} className="w-full accent-blue-600" />
            </div>

            <div>
              <label className="flex items-center gap-3 text-sm font-semibold text-gray-700 cursor-pointer">
                <input type="checkbox" checked={settings.showArrows} onChange={e => setSettings({ ...settings, showArrows: e.target.checked })} className="w-4 h-4 accent-blue-600 rounded" />
                إظهار الأسهم في نهاية الخطوط
              </label>
            </div>
          </div>
          
          <div className="pt-6 border-t mt-4">
            <button onClick={() => setSettings({ lineThickness: 2, lineColor: '#374151', fontSizeOffset: 0, boxWidth: 140, boxPadding: 8, showArrows: false })} className="w-full py-2.5 text-sm font-semibold text-gray-600 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition">إعادة ضبط المظهر</button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default App;
