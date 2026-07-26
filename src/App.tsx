import { useState, useEffect, useRef } from 'react';
import FlowChart from './FlowChart';
import type { OrgNode } from './data';
import { Download, CheckCircle2, RefreshCw, ChevronDown, FileImage, Settings2, X, AlertTriangle } from 'lucide-react';
import { supabase } from './supabase';
import { exportToImage, exportToWord, exportToExcel } from './exportUtils';
import type { Node, Edge } from '@xyflow/react';
import { initialData } from './data';

// Layout constants - matching original image exactly
// X increases left to right on screen
// Admin=far left, Academic=center, Gaza/PR/Students=far right
const CX = 1400; // president center X
const Y0 = 0, Y1 = 160, Y2_A = 280, Y2_B = 400, Y3 = 560, Y4 = 700, Y5 = 860, Y6 = 1020;

const DEFAULT_NODES: Node[] = [
  // ===== TOP =====
  { id: 'board',        type: 'orgNode', position: { x: CX - 80, y: Y0   }, data: { title: 'مجلس الأمناء',             color: 'green-dark'   } },
  { id: 'president',    type: 'orgNode', position: { x: CX - 80, y: Y1   }, data: { title: 'رئيس الجامعة',             color: 'green-dark'   } },
  { id: 'univ-council', type: 'orgNode', position: { x: CX + 280, y: Y1  }, data: { title: 'مجلس الجامعة',             color: 'green-dark'   } },

  // ===== STAFF (left & right of president) =====
  { id: 'audit',        type: 'orgNode', position: { x: CX - 420, y: Y2_A }, data: { title: 'مدير دائرة التدقيق الداخلي', color: 'green-light' } },
  { id: 'advisor',      type: 'orgNode', position: { x: CX - 420, y: Y2_B }, data: { title: 'مستشار رئيس الجامعة',       color: 'green-light' } },
  { id: 'asst-pres',    type: 'orgNode', position: { x: CX + 280, y: Y2_A }, data: { title: 'مساعد رئيس الجامعة',        color: 'green-light' } },
  { id: 'amman-office', type: 'orgNode', position: { x: CX + 280, y: Y2_B }, data: { title: 'مدير مكتب ارتباط عمان',     color: 'green-light' } },

  // ===== VP ROW — left to right: Admin, Finance, Academic(center), Quality, Branch, Gaza, PR, Students =====
  { id: 'vp-admin',       type: 'orgNode', position: { x: 100,  y: Y3 }, data: { title: 'نائب رئيس الجامعة للشؤون الإدارية',   color: 'orange' } },
  { id: 'vp-finance',     type: 'orgNode', position: { x: 580,  y: Y3 }, data: { title: 'نائب رئيس الجامعة للشؤون المالية',    color: 'orange' } },
  { id: 'vp-academic',    type: 'orgNode', position: { x: 1400, y: Y3 }, data: { title: 'نائب رئيس الجامعة للشؤون الأكاديمية', color: 'orange' } },
  { id: 'quality',        type: 'orgNode', position: { x: 2060, y: Y3 }, data: { title: 'دائرة التخطيط والجودة',               color: 'teal'   } },
  { id: 'branch-dirs',    type: 'orgNode', position: { x: 2280, y: Y3 }, data: { title: 'مدراء الفروع',                         color: 'orange' } },
  { id: 'vp-gaza',        type: 'orgNode', position: { x: 2500, y: Y3 }, data: { title: 'نائب رئيس الجامعة لقطاع غزة',        color: 'orange' } },
  { id: 'pr',             type: 'orgNode', position: { x: 2720, y: Y3 }, data: { title: 'مدير دائرة العلاقات العامة والدولية والإعلام', color: 'teal' } },
  { id: 'student-affairs', type: 'orgNode', position: { x: 2940, y: Y3 }, data: { title: 'عميد شؤون الطلبة',               color: 'teal'   } },

  // ===== ASSISTANTS — connected horizontally beside their VP =====
  { id: 'asst-vp-admin',    type: 'orgNode', position: { x: -170, y: Y3 }, data: { title: 'مساعد نائب الرئيس للشؤون الإدارية',   color: 'orange-light' } },
  { id: 'asst-vp-finance',  type: 'orgNode', position: { x: 580,  y: Y4 }, data: { title: 'مساعد نائب الرئيس للشؤون المالية',    color: 'orange-light' } },
  { id: 'asst-vp-academic', type: 'orgNode', position: { x: 1200, y: Y4 }, data: { title: 'مساعد نائب الرئيس للشؤون الأكاديمية', color: 'orange-light' } },
  { id: 'asst-vp-gaza',     type: 'orgNode', position: { x: 2500, y: Y4 }, data: { title: 'المساعد المالي لنائب الرئيس لشؤون القطاع', color: 'orange-light' } },

  // ===== UNDER VP-ADMIN (Y5) =====
  { id: 'it-center',   type: 'orgNode', position: { x: -200, y: Y5 }, data: { title: 'مدير مركز تكنولوجيا المعلومات والاتصالات', color: 'orange-light' } },
  { id: 'hr',          type: 'orgNode', position: { x:  -10, y: Y5 }, data: { title: 'مدير دائرة الموارد البشرية',                color: 'orange-light' } },
  { id: 'procurement', type: 'orgNode', position: { x:  180, y: Y5 }, data: { title: 'مدير دائرة اللوازم والمشتريات',             color: 'orange-light' } },
  { id: 'registry',    type: 'orgNode', position: { x:  370, y: Y5 }, data: { title: 'رئيس وحدة السجل المركزي والانتساب',        color: 'orange-light' } },
  { id: 'diwan',       type: 'orgNode', position: { x:  560, y: Y5 }, data: { title: 'رئيس الديوان المركزي',                     color: 'orange-light' } },
  { id: 'engineering', type: 'orgNode', position: { x:  -390, y: Y5 }, data: { title: 'مدير دائرة الهندسة والإنشاءات',           color: 'orange-light' } },

  // ===== UNDER VP-FINANCE (Y5) =====
  { id: 'finance-dir', type: 'orgNode', position: { x: 750, y: Y5 }, data: { title: 'المدير المالي', color: 'orange-light' } },

  // ===== DEANS UNDER VP-ACADEMIC (Y5) — left to right =====
  { id: 'dean-research', type: 'orgNode', position: { x: 900,  y: Y5 }, data: { title: 'عميد البحث العلمي',                              color: 'blue-light' } },
  { id: 'dean-grad',     type: 'orgNode', position: { x: 1060, y: Y5 }, data: { title: 'عميد الدراسات العليا',                          color: 'blue-light' } },
  { id: 'dean-exams',    type: 'orgNode', position: { x: 1220, y: Y5 }, data: { title: 'عميد القبول والتسجيل والامتحانات',               color: 'blue-light' } },
  { id: 'dean-econ',     type: 'orgNode', position: { x: 1380, y: Y5 }, data: { title: 'عميد كلية العلوم الاجتماعية والاقتصادية',       color: 'blue-light' } },
  { id: 'dean-tech',     type: 'orgNode', position: { x: 1540, y: Y5 }, data: { title: 'عميد كلية التكنولوجيا والعلوم التطبيقية',       color: 'blue-light' } },
  { id: 'dean-social',   type: 'orgNode', position: { x: 1700, y: Y5 }, data: { title: 'عميد كلية التنمية الاجتماعية والعلوم الاجتماعية والأسرية', color: 'blue-light' } },
  { id: 'dean-arts',     type: 'orgNode', position: { x: 1860, y: Y5 }, data: { title: 'عميد كلية الآداب',                              color: 'blue-light' } },
  { id: 'dean-media',    type: 'orgNode', position: { x: 2020, y: Y5 }, data: { title: 'عميد كلية الإعلام',                             color: 'blue-light' } },
  { id: 'dean-agri',     type: 'orgNode', position: { x: 2180, y: Y5 }, data: { title: 'عميد كلية الزراعة',                             color: 'blue-light' } },

  // ===== LEVEL 6 — sub-centers =====
  { id: 'curriculum',            type: 'orgNode', position: { x: 860,  y: Y6 }, data: { title: 'مدير مركز المناهج والمقررات الدراسية',       color: 'peach' } },
  { id: 'cont-edu',              type: 'orgNode', position: { x: 980,  y: Y6 }, data: { title: 'مدير مركز التعليم المستمر وخدمة المجتمع',    color: 'peach' } },
  { id: 'library',               type: 'orgNode', position: { x: 1100, y: Y6 }, data: { title: 'أمين المكتبة المركزية',                        color: 'peach' } },
  { id: 'digital',               type: 'orgNode', position: { x: 1220, y: Y6 }, data: { title: 'مدير مركز التعليم الرقمي',                     color: 'peach' } },
  { id: 'admin-research-center', type: 'orgNode', position: { x: 1340, y: Y6 }, data: { title: 'كلية الأبحاث الإدارية والاقتصادية',            color: 'peach' } },
  { id: 'folk-center',           type: 'orgNode', position: { x: 1860, y: Y6 }, data: { title: 'مدير مركز التراث الشعبي',                      color: 'peach' } },
  { id: 'agri-center',           type: 'orgNode', position: { x: 2180, y: Y6 }, data: { title: 'مدير مركز البحوث الزراعية',                    color: 'peach' } },
];

const DEFAULT_EDGES: Edge[] = [
  // مجلس الأمناء → رئيس (دashed)
  { id: 'e-board-pres',   source: 'board',     target: 'president',    type: 'orgEdge', style: { strokeDasharray: '8,4' } },
  // رئيس ↔ مجلس الجامعة (أفقي)
  { id: 'e-pres-council', source: 'president', target: 'univ-council', type: 'orgEdge' },
  // رئيس → التدقيق (يسار)
  { id: 'e-pres-audit',   source: 'president', target: 'audit',        type: 'orgEdge' },
  // رئيس → مستشار (يسار)
  { id: 'e-pres-advisor', source: 'president', target: 'advisor',      type: 'orgEdge' },
  // رئيس → مساعد رئيس (يمين)
  { id: 'e-pres-asst',    source: 'president', target: 'asst-pres',    type: 'orgEdge' },
  // مستشار ↔ مكتب عمان (خط منقط أفقي - كما في الصورة)
  { id: 'e-advisor-amman', source: 'advisor', target: 'amman-office',  type: 'orgEdge', style: { strokeDasharray: '8,4' } },
  // President → VPs
  { id: 'e-pres-vpadmin',  source: 'president', target: 'vp-admin',       type: 'orgEdge' },
  { id: 'e-pres-vpfin',    source: 'president', target: 'vp-finance',     type: 'orgEdge' },
  { id: 'e-pres-vpac',     source: 'president', target: 'vp-academic',    type: 'orgEdge' },
  { id: 'e-pres-qual',     source: 'president', target: 'quality',        type: 'orgEdge' },
  { id: 'e-pres-branch',   source: 'president', target: 'branch-dirs',    type: 'orgEdge' },
  { id: 'e-pres-vpgaza',   source: 'president', target: 'vp-gaza',        type: 'orgEdge' },
  { id: 'e-pres-pr',       source: 'president', target: 'pr',             type: 'orgEdge' },
  { id: 'e-pres-student',  source: 'president', target: 'student-affairs',type: 'orgEdge' },
  // VPs → Assistants
  { id: 'e-vpadmin-asst',  source: 'vp-admin',   target: 'asst-vp-admin',    type: 'orgEdge' },
  { id: 'e-vpfin-asst',    source: 'vp-finance', target: 'asst-vp-finance',  type: 'orgEdge' },
  { id: 'e-vpac-asst',     source: 'vp-academic',target: 'asst-vp-academic', type: 'orgEdge' },
  { id: 'e-vpgaza-asst',   source: 'vp-gaza',    target: 'asst-vp-gaza',     type: 'orgEdge' },
  // Admin → departments
  { id: 'e-vpadmin-it',    source: 'vp-admin', target: 'it-center',   type: 'orgEdge' },
  { id: 'e-vpadmin-hr',    source: 'vp-admin', target: 'hr',          type: 'orgEdge' },
  { id: 'e-vpadmin-proc',  source: 'vp-admin', target: 'procurement', type: 'orgEdge' },
  { id: 'e-vpadmin-reg',   source: 'vp-admin', target: 'registry',    type: 'orgEdge' },
  { id: 'e-vpadmin-diwan', source: 'vp-admin', target: 'diwan',       type: 'orgEdge' },
  { id: 'e-vpadmin-eng',   source: 'vp-admin', target: 'engineering', type: 'orgEdge' },
  // Finance → director
  { id: 'e-vpfin-dir',     source: 'vp-finance', target: 'finance-dir', type: 'orgEdge' },
  // Academic → Deans
  { id: 'e-vpac-res',    source: 'vp-academic', target: 'dean-research', type: 'orgEdge' },
  { id: 'e-vpac-grad',   source: 'vp-academic', target: 'dean-grad',     type: 'orgEdge' },
  { id: 'e-vpac-exams',  source: 'vp-academic', target: 'dean-exams',    type: 'orgEdge' },
  { id: 'e-vpac-econ',   source: 'vp-academic', target: 'dean-econ',     type: 'orgEdge' },
  { id: 'e-vpac-tech',   source: 'vp-academic', target: 'dean-tech',     type: 'orgEdge' },
  { id: 'e-vpac-social', source: 'vp-academic', target: 'dean-social',   type: 'orgEdge' },
  { id: 'e-vpac-arts',   source: 'vp-academic', target: 'dean-arts',     type: 'orgEdge' },
  { id: 'e-vpac-media',  source: 'vp-academic', target: 'dean-media',    type: 'orgEdge' },
  { id: 'e-vpac-agri',   source: 'vp-academic', target: 'dean-agri',     type: 'orgEdge' },
  // Dean sub-centers
  { id: 'e-res-curr',    source: 'dean-research', target: 'curriculum',            type: 'orgEdge' },
  { id: 'e-res-cont',    source: 'dean-research', target: 'cont-edu',              type: 'orgEdge' },
  { id: 'e-res-lib',     source: 'dean-research', target: 'library',               type: 'orgEdge' },
  { id: 'e-res-digital', source: 'dean-research', target: 'digital',               type: 'orgEdge' },
  { id: 'e-exams-arc',   source: 'dean-exams',    target: 'admin-research-center', type: 'orgEdge' },
  { id: 'e-arts-folk',   source: 'dean-arts',     target: 'folk-center',           type: 'orgEdge' },
  { id: 'e-agri-center', source: 'dean-agri',     target: 'agri-center',           type: 'orgEdge' },
];


function App() {
  const [nodes, setNodes] = useState<Node[]>(DEFAULT_NODES);
  const [edges, setEdges] = useState<Edge[]>(DEFAULT_EDGES);
  
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string>('saved');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);
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
    }, 500);

    return () => clearTimeout(saveTimeout.current);
  }, [nodes, edges]);

  const convertLegacyData = (orgNode: OrgNode) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    const traverse = (node: OrgNode, parentId?: string, isRightStaff?: boolean, isLeftStaff?: boolean, isSibling?: boolean) => {
      newNodes.push({
        id: node.id,
        type: 'orgNode',
        position: node.position || { x: Math.random() * 200, y: Math.random() * 200 },
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
    // Return explicit layout directly instead of forcing dagre auto-layout
    // which breaks side nodes and doesn't match original design exactly.
    return { nodes: newNodes, edges: newEdges };
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
        console.error('Save error details:', error);
        throw new Error(`[${import.meta.env.VITE_SUPABASE_URL}] ${error.message || JSON.stringify(error)}`);
      }
      
      setSaveStatus('saved');
    } catch (err: any) {
      console.error(err);
      setSaveStatus(`error: ${err.message || 'Unknown error'}`);
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
              saveStatus.startsWith('error') ? 'text-red-500' : 'text-orange-500'
            }`}>
              {saveStatus === 'saved' && <><CheckCircle2 size={12}/> تم الحفظ</>}
              {saveStatus === 'saving' && <><RefreshCw size={12} className="animate-spin"/> جاري الحفظ التلقائي...</>}
              {saveStatus.startsWith('error') && `فشل الحفظ: ${saveStatus}`}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 relative">
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded font-bold shadow-sm border transition ${isEditMode ? 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'}`}
          >
            <AlertTriangle size={16}/> {isEditMode ? 'وضع الرسم الحر (مفعل)' : 'وضع العرض (مقفل)'}
          </button>
          
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
                <button onClick={() => { exportToWord(nodes, edges); setExportMenuOpen(false); }} className="w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 flex items-center gap-3">ملف وورد (Word)</button>
                <button onClick={() => { exportToExcel(nodes, edges); setExportMenuOpen(false); }} className="w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 flex items-center gap-3">ملف إكسل (Excel)</button>
                <div className="h-px bg-gray-100 my-1"/>
                <button onClick={exportToJson} className="w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-600">تصدير بيانات (JSON)</button>
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
             <FlowChart initialNodes={nodes} initialEdges={edges} onSave={handleUpdateData} settings={{...settings, isEditMode}} />
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
