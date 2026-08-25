import { useState, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';

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
      // Refresh iframe with the returned Supabase URL if available
      if (iframeRef.current) {
        if (data.reportUrl) {
            iframeRef.current.src = `${data.reportUrl}?t=${new Date().getTime()}`;
        } else {
            iframeRef.current.src = `${backendUrl}/qou/تقرير_المتابعة_التفاعلي_v3.html?t=${new Date().getTime()}`;
        }
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

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const initialIframeSrc = supabaseUrl 
    ? `${supabaseUrl}/storage/v1/object/public/reports/تقرير_المتابعة_التفاعلي_v3.html` 
    : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/qou/تقرير_المتابعة_التفاعلي_v3.html`;

  return (
    <div className="flex h-full w-full bg-gray-100 p-4 gap-4">
      {/* HTML Interface - Takes up remaining space */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 bg-blue-800 text-white p-2 flex justify-between items-center z-10 shadow-md">
          <div className="flex gap-2">
            <button 
              className="bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded text-sm font-bold flex items-center gap-2 transition-colors relative"
            >
              {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              {isUploading ? 'جاري الرفع والتحديث...' : 'رفع ملف وتحديث التقرير'}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept=".pdf,.xlsx,.xls"
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={isUploading}
              />
            </button>
          </div>
          <div className="font-bold">واجهة التقارير</div>
        </div>
        
        <div className="pt-12 w-full h-full">
            <iframe 
                ref={iframeRef}
                src={initialIframeSrc} 
                className="w-full h-full border-0"
                title="HTML Interface"
            />
        </div>
      </div>
    </div>
  );
}
