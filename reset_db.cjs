const { createClient } = require('@supabase/supabase-js');

// Pixel spacing constants
const NODE_W = 160;
const NODE_H = 60;
const GAP_X = 20;
const GAP_Y = 100;

// Y levels
const Y0 = 0;    // مجلس الأمناء
const Y1 = 160;  // رئيس الجامعة + مجلس الجامعة
const Y2 = 280;  // مدير دائرة التدقيق + مساعد رئيس + مدير مكتب عمان + مستشار
const Y3 = 440;  // صف النواب الرئيسيين (6)
const Y4 = 580;  // المساعدون
const Y5 = 720;  // الإدارات / الكليات (صف واحد)
const Y6 = 880;  // تحت الكليات

// X positions for the 6 main VPs (from right to left in RTL: admin=rightmost, then going left)
// The image from right to left: vp-admin, vp-finance, vp-academic (center-right), [quality+branch in middle], vp-gaza, pr(standalone), student-affairs(standalone)
// Let's lay them out in X from left to right on screen (RTL: rightmost on screen = first from right)

// Center of the chart at X=1400
// rئيس الجامعة at center

const CX = 1400; // center x

const nodes = [
  // ========== TOP LEVEL ==========
  { id: 'board', type: 'orgNode', position: { x: CX - 80, y: Y0 }, 
    data: { title: 'مجلس الأمناء', color: 'green-dark', id: 'board' } },

  // Level 1: رئيس الجامعة + مجلس الجامعة (horizontal)
  { id: 'president', type: 'orgNode', position: { x: CX - 80, y: Y1 }, 
    data: { title: 'رئيس الجامعة', color: 'green-dark', id: 'president' } },
  { id: 'univ-council', type: 'orgNode', position: { x: CX + 240, y: Y1 }, 
    data: { title: 'مجلس الجامعة', color: 'green-dark', id: 'univ-council' } },

  // Level 2: left side staff of president (right side of chart in RTL = left visually)
  { id: 'audit', type: 'orgNode', position: { x: CX - 320, y: Y2 - 60 }, 
    data: { title: 'مدير دائرة التدقيق الداخلي', color: 'green-light', id: 'audit' } },
  { id: 'advisor', type: 'orgNode', position: { x: CX - 320, y: Y2 + 80 }, 
    data: { title: 'مستشار رئيس الجامعة', color: 'green-light', id: 'advisor' } },
  { id: 'asst-pres', type: 'orgNode', position: { x: CX + 240, y: Y2 - 60 }, 
    data: { title: 'مساعد رئيس الجامعة', color: 'green-light', id: 'asst-pres' } },
  { id: 'amman-office', type: 'orgNode', position: { x: CX + 240, y: Y2 + 80 }, 
    data: { title: 'مدير مكتب ارتباط عمان', color: 'green-light', id: 'amman-office' } },

  // ========== VP LEVEL (6 main VPs + quality + branch) ==========
  // From image right-to-left order: vp-admin, vp-finance, [center=vp-academic], quality/branch, vp-gaza, pr, student-affairs
  // We'll space them evenly

  // نائب رئيس - الشؤون الإدارية (rightmost)
  { id: 'vp-admin', type: 'orgNode', position: { x: 2400, y: Y3 }, 
    data: { title: 'نائب رئيس الجامعة للشؤون الإدارية', color: 'orange', id: 'vp-admin' } },

  // نائب رئيس - المالية
  { id: 'vp-finance', type: 'orgNode', position: { x: 2050, y: Y3 }, 
    data: { title: 'نائب رئيس الجامعة للشؤون المالية', color: 'orange', id: 'vp-finance' } },

  // نائب رئيس - الأكاديمية (center)
  { id: 'vp-academic', type: 'orgNode', position: { x: 1400, y: Y3 }, 
    data: { title: 'نائب رئيس الجامعة للشؤون الأكاديمية', color: 'orange', id: 'vp-academic' } },

  // دائرة الجودة والتخطيط
  { id: 'quality', type: 'orgNode', position: { x: 950, y: Y3 }, 
    data: { title: 'دائرة التخطيط والجودة', color: 'teal', id: 'quality' } },

  // مدراء الفروع
  { id: 'branch-dirs', type: 'orgNode', position: { x: 700, y: Y3 }, 
    data: { title: 'مدراء الفروع', color: 'orange', id: 'branch-dirs' } },

  // نائب رئيس - قطاع غزة
  { id: 'vp-gaza', type: 'orgNode', position: { x: 400, y: Y3 }, 
    data: { title: 'نائب رئيس الجامعة لقطاع غزة', color: 'orange', id: 'vp-gaza' } },

  // مدير دائرة العلاقات العامة
  { id: 'pr', type: 'orgNode', position: { x: 150, y: Y3 }, 
    data: { title: 'مدير دائرة العلاقات العامة والدولية والإعلام', color: 'teal', id: 'pr' } },

  // عميد شؤون طلبة
  { id: 'student-affairs', type: 'orgNode', position: { x: -100, y: Y3 }, 
    data: { title: 'عميد شؤون طلبة حلبة', color: 'teal', id: 'student-affairs' } },

  // ========== ASSISTANTS (level 4) ==========
  { id: 'asst-vp-admin', type: 'orgNode', position: { x: 2400, y: Y4 }, 
    data: { title: 'مساعد نائب الرئيس للشؤون الإدارية', color: 'orange-light', id: 'asst-vp-admin' } },
  { id: 'asst-vp-finance', type: 'orgNode', position: { x: 2050, y: Y4 }, 
    data: { title: 'مساعد نائب الرئيس للشؤون المالية', color: 'orange-light', id: 'asst-vp-finance' } },
  { id: 'asst-vp-academic', type: 'orgNode', position: { x: 1400, y: Y4 }, 
    data: { title: 'مساعد نائب الرئيس للشؤون الأكاديمية', color: 'orange-light', id: 'asst-vp-academic' } },
  { id: 'asst-vp-gaza', type: 'orgNode', position: { x: 400, y: Y4 }, 
    data: { title: 'المساعد المالي لنائب الرئيس لشؤون القطاع', color: 'orange-light', id: 'asst-vp-gaza' } },

  // ========== UNDER VP-ADMIN (level 5) ==========
  { id: 'it-center', type: 'orgNode', position: { x: 2700, y: Y5 }, 
    data: { title: 'مركز تكنولوجيا المعلومات والاتصالات', color: 'orange-light', id: 'it-center' } },
  { id: 'hr', type: 'orgNode', position: { x: 2520, y: Y5 }, 
    data: { title: 'مدير دائرة الموارد البشرية', color: 'orange-light', id: 'hr' } },
  { id: 'procurement', type: 'orgNode', position: { x: 2340, y: Y5 }, 
    data: { title: 'مدير دائرة اللوازم والمشتريات', color: 'orange-light', id: 'procurement' } },
  { id: 'registry', type: 'orgNode', position: { x: 2160, y: Y5 }, 
    data: { title: 'رئيس وحدة السجل المركزي والانتساب', color: 'orange-light', id: 'registry' } },
  { id: 'finance-dir', type: 'orgNode', position: { x: 2050, y: Y5 }, 
    data: { title: 'المدير المالي', color: 'orange-light', id: 'finance-dir' } },

  // ========== UNDER VP-ACADEMIC - Deans (level 5) ==========
  { id: 'dean-agri', type: 'orgNode', position: { x: 1780, y: Y5 }, 
    data: { title: 'عميد كلية الزراعة', color: 'blue-light', id: 'dean-agri' } },
  { id: 'dean-media', type: 'orgNode', position: { x: 1640, y: Y5 }, 
    data: { title: 'عميد كلية الإعلام', color: 'blue-light', id: 'dean-media' } },
  { id: 'dean-arts', type: 'orgNode', position: { x: 1500, y: Y5 }, 
    data: { title: 'عميد كلية الآداب', color: 'blue-light', id: 'dean-arts' } },
  { id: 'dean-social', type: 'orgNode', position: { x: 1360, y: Y5 }, 
    data: { title: 'عميد كلية التنمية الاجتماعية والعلوم الاجتماعية والأسرية', color: 'blue-light', id: 'dean-social' } },
  { id: 'dean-tech', type: 'orgNode', position: { x: 1220, y: Y5 }, 
    data: { title: 'عميد كلية التكنولوجيا والعلوم التطبيقية', color: 'blue-light', id: 'dean-tech' } },
  { id: 'dean-econ', type: 'orgNode', position: { x: 1080, y: Y5 }, 
    data: { title: 'عميد كلية العلوم الاجتماعية والاقتصادية', color: 'blue-light', id: 'dean-econ' } },
  { id: 'dean-edu', type: 'orgNode', position: { x: 940, y: Y5 }, 
    data: { title: 'عميد القبول والتسجيل والامتحانات', color: 'blue-light', id: 'dean-edu' } },
  { id: 'dean-reg', type: 'orgNode', position: { x: 800, y: Y5 }, 
    data: { title: 'عميد الدراسات العليا', color: 'blue-light', id: 'dean-reg' } },
  { id: 'dean-research', type: 'orgNode', position: { x: 660, y: Y5 }, 
    data: { title: 'عميد البحث العلمي', color: 'blue-light', id: 'dean-research' } },

  // دائرة التخطيط والجودة sub
  { id: 'planning-dir', type: 'orgNode', position: { x: 950, y: Y4 }, 
    data: { title: 'دائرة التخطيط والجودة', color: 'teal', id: 'planning-dir' } },

  // ========== LEVEL 6 - under deans ==========
  { id: 'agri-center', type: 'orgNode', position: { x: 1780, y: Y6 }, 
    data: { title: 'مدير مركز البحوث الزراعية', color: 'peach', id: 'agri-center' } },
  { id: 'folk-center', type: 'orgNode', position: { x: 1500, y: Y6 }, 
    data: { title: 'مدير مركز التراث الشعبي', color: 'peach', id: 'folk-center' } },
  { id: 'research-center', type: 'orgNode', position: { x: 950, y: Y6 }, 
    data: { title: 'كلية الأبحاث الإدارية والاقتصادية', color: 'peach', id: 'research-center' } },

  // Under dean-research
  { id: 'curriculum', type: 'orgNode', position: { x: 720, y: Y6 }, 
    data: { title: 'مدير مركز المناهج والمقررات الدراسية', color: 'peach', id: 'curriculum' } },
  { id: 'cont-edu', type: 'orgNode', position: { x: 580, y: Y6 }, 
    data: { title: 'مدير مركز التعليم المستمر وخدمة المجتمع', color: 'peach', id: 'cont-edu' } },
  { id: 'e-learning', type: 'orgNode', position: { x: 440, y: Y6 }, 
    data: { title: 'أمين المكتبة المركزية', color: 'peach', id: 'e-learning' } },
  { id: 'digital', type: 'orgNode', position: { x: 300, y: Y6 }, 
    data: { title: 'مدير مركز التعليم الرقمي', color: 'peach', id: 'digital' } },

  // رئيس ديوان + under admin
  { id: 'diwan', type: 'orgNode', position: { x: 2520, y: Y6 }, 
    data: { title: 'رئيس الديوان الطركزي', color: 'orange-light', id: 'diwan' } },
  { id: 'engineering', type: 'orgNode', position: { x: 2700, y: Y6 }, 
    data: { title: 'مدير دائرة الهندسة والمشترياتالا', color: 'orange-light', id: 'engineering' } },
];

const edges = [
  // مجلس الأمناء → رئيس الجامعة (dashed)
  { id: 'e-board-pres', source: 'board', target: 'president', type: 'orgEdge', style: { strokeDasharray: '8,4' } },
  // رئيس ← مجلس الجامعة (horizontal)
  { id: 'e-pres-council', source: 'president', target: 'univ-council', type: 'orgEdge' },
  // رئيس → audit (left branch, solid)
  { id: 'e-pres-audit', source: 'president', target: 'audit', type: 'orgEdge' },
  // رئيس → advisor (dashed)
  { id: 'e-pres-advisor', source: 'president', target: 'advisor', type: 'orgEdge', style: { strokeDasharray: '8,4' } },
  // رئيس → مساعد رئيس (right branch)
  { id: 'e-pres-asst', source: 'president', target: 'asst-pres', type: 'orgEdge' },
  // رئيس → مكتب عمان (right)
  { id: 'e-pres-amman', source: 'president', target: 'amman-office', type: 'orgEdge' },
  // رئيس → النواب
  { id: 'e-pres-vpadmin', source: 'president', target: 'vp-admin', type: 'orgEdge' },
  { id: 'e-pres-vpfin', source: 'president', target: 'vp-finance', type: 'orgEdge' },
  { id: 'e-pres-vpac', source: 'president', target: 'vp-academic', type: 'orgEdge' },
  { id: 'e-pres-qual', source: 'president', target: 'quality', type: 'orgEdge' },
  { id: 'e-pres-branch', source: 'president', target: 'branch-dirs', type: 'orgEdge' },
  { id: 'e-pres-vpgaza', source: 'president', target: 'vp-gaza', type: 'orgEdge' },
  { id: 'e-pres-pr', source: 'president', target: 'pr', type: 'orgEdge' },
  { id: 'e-pres-student', source: 'president', target: 'student-affairs', type: 'orgEdge' },
  // المساعدون
  { id: 'e-vpadmin-asst', source: 'vp-admin', target: 'asst-vp-admin', type: 'orgEdge' },
  { id: 'e-vpfin-asst', source: 'vp-finance', target: 'asst-vp-finance', type: 'orgEdge' },
  { id: 'e-vpac-asst', source: 'vp-academic', target: 'asst-vp-academic', type: 'orgEdge' },
  { id: 'e-vpgaza-asst', source: 'vp-gaza', target: 'asst-vp-gaza', type: 'orgEdge' },
  // Under admin
  { id: 'e-vpadmin-it', source: 'vp-admin', target: 'it-center', type: 'orgEdge' },
  { id: 'e-vpadmin-hr', source: 'vp-admin', target: 'hr', type: 'orgEdge' },
  { id: 'e-vpadmin-proc', source: 'vp-admin', target: 'procurement', type: 'orgEdge' },
  { id: 'e-vpadmin-reg', source: 'vp-admin', target: 'registry', type: 'orgEdge' },
  // Under finance
  { id: 'e-vpfin-findir', source: 'vp-finance', target: 'finance-dir', type: 'orgEdge' },
  // Under academic - deans
  { id: 'e-vpac-agri', source: 'vp-academic', target: 'dean-agri', type: 'orgEdge' },
  { id: 'e-vpac-media', source: 'vp-academic', target: 'dean-media', type: 'orgEdge' },
  { id: 'e-vpac-arts', source: 'vp-academic', target: 'dean-arts', type: 'orgEdge' },
  { id: 'e-vpac-social', source: 'vp-academic', target: 'dean-social', type: 'orgEdge' },
  { id: 'e-vpac-tech', source: 'vp-academic', target: 'dean-tech', type: 'orgEdge' },
  { id: 'e-vpac-econ', source: 'vp-academic', target: 'dean-econ', type: 'orgEdge' },
  { id: 'e-vpac-edu', source: 'vp-academic', target: 'dean-edu', type: 'orgEdge' },
  { id: 'e-vpac-reg', source: 'vp-academic', target: 'dean-reg', type: 'orgEdge' },
  { id: 'e-vpac-res', source: 'vp-academic', target: 'dean-research', type: 'orgEdge' },
  // Dean sub-centers
  { id: 'e-agri-center', source: 'dean-agri', target: 'agri-center', type: 'orgEdge' },
  { id: 'e-arts-folk', source: 'dean-arts', target: 'folk-center', type: 'orgEdge' },
  { id: 'e-econ-research', source: 'dean-edu', target: 'research-center', type: 'orgEdge' },
  { id: 'e-res-curr', source: 'dean-research', target: 'curriculum', type: 'orgEdge' },
  { id: 'e-res-cont', source: 'dean-research', target: 'cont-edu', type: 'orgEdge' },
  { id: 'e-res-elib', source: 'dean-research', target: 'e-learning', type: 'orgEdge' },
  { id: 'e-res-digital', source: 'dean-research', target: 'digital', type: 'orgEdge' },
  // Under admin level 6
  { id: 'e-hr-diwan', source: 'hr', target: 'diwan', type: 'orgEdge' },
  { id: 'e-it-eng', source: 'it-center', target: 'engineering', type: 'orgEdge' },
];

const supabase = createClient(
  'https://enguagkgtdpwljppovrp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZ3VhZ2tndGRwd2xqcHBvdnJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNjExMDIsImV4cCI6MjEwMDYzNzEwMn0.4ehqWwui-NU3Cwox4n9ItVVIULMpiSnOFmFyeNeSNhw'
);

supabase.from('org_chart').upsert({ id: 1, data: { nodes, edges } })
  .then(({ error }) => {
    if (error) console.error('Error:', error);
    else console.log(`Done! Uploaded ${nodes.length} nodes and ${edges.length} edges.`);
  });
