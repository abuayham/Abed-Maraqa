import React from 'react';
import { Network, FileText } from 'lucide-react';

interface HomeProps {
  onSelectTab: (tab: 'free' | 'reports') => void;
}

export function Home({ onSelectTab }: HomeProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6 font-sans" dir="rtl">
      <div className="text-center mb-12">
        <div className="bg-blue-600 text-white p-4 rounded-2xl inline-block mb-4 shadow-lg">
          <Network size={48} />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">نظام الإدارة المتقدم</h1>
        <p className="text-lg text-gray-600">اختر القسم الذي تود العمل عليه</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Structure Card */}
        <button 
          onClick={() => onSelectTab('free')}
          className="group relative bg-white/70 backdrop-blur-md border border-white/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-right overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-70 opacity-0"></div>
          <div className="relative z-10">
            <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <Network size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">الهيكل التنظيمي</h2>
            <p className="text-gray-600 leading-relaxed">
              إدارة الهياكل التنظيمية، تصميم حر واحترافي، وتوزيع المهام والصلاحيات بكل سهولة.
            </p>
          </div>
        </button>

        {/* Reports Card */}
        <button 
          onClick={() => onSelectTab('reports')}
          className="group relative bg-white/70 backdrop-blur-md border border-white/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-right overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-70 opacity-0"></div>
          <div className="relative z-10">
            <div className="bg-indigo-100 text-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <FileText size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">التقارير والملفات</h2>
            <p className="text-gray-600 leading-relaxed">
              عرض لوحات القيادة والتقارير التفاعلية، مع إمكانية قراءة ملفات PDF وتحليل جداول Excel.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
