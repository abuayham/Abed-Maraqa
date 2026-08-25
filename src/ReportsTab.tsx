import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileText, FileSpreadsheet, X, Loader2 } from 'lucide-react';

export function ReportsTab() {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'excel' | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      setFileType('pdf');
      setExcelData([]);
    } else if (file.type.includes('spreadsheetml') || file.type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to array of objects
        const json = XLSX.utils.sheet_to_json(worksheet);
        if (json.length > 0) {
          setExcelColumns(Object.keys(json[0] as object));
          setExcelData(json);
        }
        setFileType('excel');
        setFileUrl(null);
      };
      reader.readAsArrayBuffer(file);
    }
    
    // Upload to local server to update the report
    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشل في رفع الملف');
      }
      
      // Refresh iframe
      if (iframeRef.current) {
        iframeRef.current.src = `/qou/تقرير_المتابعة_التفاعلي_v3.html?t=${new Date().getTime()}`;
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

  const closeViewer = () => {
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
    setFileUrl(null);
    setFileType(null);
    setExcelData([]);
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
                src="/qou/تقرير_المتابعة_التفاعلي_v3.html" 
                className="w-full h-full border-0"
                title="HTML Interface"
            />
        </div>
      </div>

      {/* File Viewer Section */}
      {fileType && (
        <div className="w-1/2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex justify-between items-center">
            <div className="flex items-center gap-2">
              {fileType === 'pdf' ? <FileText className="text-red-500" size={20} /> : <FileSpreadsheet className="text-green-600" size={20} />}
              <h2 className="font-bold text-gray-700">عارض الملفات</h2>
            </div>
            <button onClick={closeViewer} className="text-gray-400 hover:text-red-500 transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-auto bg-gray-50 p-2">
            {fileType === 'pdf' && fileUrl && (
              <object data={fileUrl} type="application/pdf" className="w-full h-full rounded border border-gray-200 shadow-sm">
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <p>متصفحك لا يدعم عرض الـ PDF.</p>
                    <a href={fileUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline mt-2">اضغط هنا لتحميل الملف</a>
                </div>
              </object>
            )}
            
            {fileType === 'excel' && excelData.length > 0 && (
              <div className="overflow-x-auto h-full">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 shadow-sm rounded-lg overflow-hidden text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      {excelColumns.map((col, idx) => (
                        <th key={idx} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {excelData.map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-gray-50">
                        {excelColumns.map((col, colIdx) => (
                          <td key={colIdx} className="px-4 py-2 whitespace-nowrap text-gray-700">
                            {row[col] !== undefined ? String(row[col]) : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
