import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileText, FileSpreadsheet, X, Loader2 } from 'lucide-react';

export function ReportsTab() {
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Upload ALL files to local server to update the report
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    setIsUploading(true);
    try {
      const response = await fetch(`${backendUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشل في رفع الملف');
      }
      
      // Refresh iframe
      if (iframeRef.current) {
        iframeRef.current.src = `${backendUrl}/qou/تقرير_المتابعة_التفاعلي_v3.html?t=${new Date().getTime()}`;
      }
      
      alert(data.message);
    } catch (error: any) {
      alert(`حدث خطأ: ${error.message}. تأكد من تشغيل الخادم المحلي.`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex h-full w-full bg-gray-100 p-4 gap-4">
      {/* HTML Interface - Takes up remaining space */}
      <div className={`flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative transition-all duration-300`}>
        <div className="absolute top-0 left-0 right-0 bg-gray-50 border-b border-gray-200 px-4 py-2 flex justify-between items-center z-10">
          <h2 className="font-bold text-gray-700">واجهة التقارير</h2>
          <div className="flex gap-2">
            <input 
              type="file" 
              multiple
              ref={fileInputRef}
              onChange={handleFileUpload} 
              accept=".pdf,.xlsx,.xls" 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {isUploading ? 'جاري التحديث...' : 'رفع ملف وتحديث التقرير'}
            </button>
          </div>
        </div>
        <div className="pt-12 w-full h-full">
            <iframe 
                ref={iframeRef}
                src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/qou/تقرير_المتابعة_التفاعلي_v3.html`} 
                className="w-full h-full border-0"
                title="HTML Interface"
            />
        </div>
      </div>
    </div>
  );
}
