import React, { useState, useEffect } from 'react';
import { OrgChart } from './OrgChart';
import { initialData, type OrgNode } from './data';
import { Download, Save } from 'lucide-react';

function App() {
  const [data, setData] = useState<OrgNode>(() => {
    const saved = localStorage.getItem('orgChartDataV4');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialData;
      }
    }
    return initialData;
  });

  useEffect(() => {
    localStorage.setItem('orgChartDataV4', JSON.stringify(data));
  }, [data]);

  const exportToJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
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
          <p className="text-sm text-gray-500">لوحة تحكم تفاعلية وقابلة للتعديل</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportToJson}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
          >
            <Download size={18} /> تصدير JSON
          </button>
          <button 
            onClick={() => alert('تم حفظ التعديلات محلياً في المتصفح!')}
            className="flex items-center gap-2 px-4 py-2 bg-org-dark-green text-white rounded hover:bg-green-800 transition"
          >
            <Save size={18} /> حفظ
          </button>
        </div>
      </header>
      
      <main className="flex-1 w-full overflow-auto">
        <div className="min-w-max p-8">
           <OrgChart data={data} onUpdate={setData} />
        </div>
      </main>
    </div>
  );
}

export default App;
