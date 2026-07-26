import { useState, useEffect } from 'react';
import { OrgChart } from './OrgChart';
import { initialData, type OrgNode } from './data';
import { Download, Save, RefreshCw } from 'lucide-react';
import { supabase } from './supabase';

function App() {
  const [data, setData] = useState<OrgNode>(initialData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

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
        // Fallback to initial data if no row exists yet
        setData(initialData);
      } else if (orgData && orgData.data) {
        setData(orgData.data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('org_chart')
        .upsert({ id: 1, data: data });
      
      if (error) {
        alert('خطأ أثناء الحفظ في قاعدة البيانات');
        console.error(error);
      } else {
        alert('تم حفظ التعديلات بنجاح في قاعدة البيانات!');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ غير متوقع');
    } finally {
      setSaving(false);
    }
  };

  const exportToJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "org-chart-data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center z-10 sticky top-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">الهيكل التنظيمي (جامعة)</h1>
          <p className="text-sm text-gray-500">لوحة تحكم تفاعلية متصلة بـ Supabase</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
            title="تحديث البيانات"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> تحديث
          </button>
          <button 
            onClick={exportToJson}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
          >
            <Download size={18} /> تصدير JSON
          </button>
          <button 
            onClick={saveData}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-org-dark-green text-white rounded hover:bg-green-800 transition disabled:opacity-70"
          >
            <Save size={18} /> {saving ? 'جاري الحفظ...' : 'حفظ في السحابة'}
          </button>
        </div>
      </header>
      
      <main className="flex-1 w-full overflow-auto">
        <div className="min-w-max p-8">
           {loading ? (
             <div className="flex justify-center items-center h-64 text-gray-500">جاري تحميل البيانات...</div>
           ) : (
             <OrgChart data={data} onUpdate={setData} />
           )}
        </div>
      </main>
    </div>
  );
}

export default App;
