import type { Node, Edge } from '@xyflow/react';

export const initialNodes: Node[] = [
  { id: '1', type: 'orgNode', data: { label: 'مجلس الأمناء', color: 'green-dark' }, position: { x: 900, y: 0 } },
  { id: '2', type: 'orgNode', data: { label: 'رئيس الجامعة', color: 'green-dark' }, position: { x: 900, y: 150 } },
  { id: '3', type: 'orgNode', data: { label: 'مجلس الجامعة', color: 'green-dark' }, position: { x: 1350, y: 150 } },
  
  // Side staff
  { id: '4', type: 'orgNode', data: { label: 'مدير دائرة التدقيق الداخلي', color: 'green-light' }, position: { x: 450, y: 250 } },
  { id: '5', type: 'orgNode', data: { label: 'مستشار رئيس الجامعة', color: 'green-light' }, position: { x: 450, y: 350 } },
  { id: '6', type: 'orgNode', data: { label: 'مساعد رئيس الجامعة', color: 'green-light' }, position: { x: 1350, y: 250 } },
  { id: '7', type: 'orgNode', data: { label: 'مدير مكتب ارتباط عمان', color: 'green-light' }, position: { x: 1350, y: 350 } },

  // Routing Nodes for Trunk Lines
  { id: 'rn-pres-trunk', type: 'routingNode', data: {}, position: { x: 1035, y: 400 } },
  { id: 'rn-vp-admin-trunk', type: 'routingNode', data: {}, position: { x: -405, y: 600 } },
  { id: 'rn-vp-acad-trunk', type: 'routingNode', data: {}, position: { x: 1035, y: 600 } },

  // Vice Presidents and Directors directly under President (y: 500)
  { id: '8', type: 'orgNode', data: { label: 'نائب رئيس الجامعة للشؤون الإدارية', color: 'orange' }, position: { x: -540, y: 450 } },
  { id: '9', type: 'orgNode', data: { label: 'نائب رئيس الجامعة للشؤون المالية', color: 'orange' }, position: { x: -180, y: 450 } },
  { id: '10', type: 'orgNode', data: { label: 'نائب رئيس الجامعة للشؤون الأكاديمية', color: 'orange' }, position: { x: 900, y: 450 } },
  { id: '11', type: 'orgNode', data: { label: 'مدير دائرة التخطيط والجودة', color: 'blue-light' }, position: { x: 1800, y: 450 } },
  { id: '12', type: 'orgNode', data: { label: 'مدراء الفروع', color: 'orange' }, position: { x: 2070, y: 450 } },
  { id: '13', type: 'orgNode', data: { label: 'نائب رئيس الجامعة لشؤون قطاع غزة', color: 'orange' }, position: { x: 2340, y: 450 } },
  { id: '14', type: 'orgNode', data: { label: 'مدير دائرة العلاقات العامة والدولية والإعلام', color: 'blue-light' }, position: { x: 2700, y: 450 } },
  { id: '15', type: 'orgNode', data: { label: 'عميد شؤون الطلبة', color: 'blue-light' }, position: { x: 3060, y: 450 } },

  // Assistants
  { id: '16', type: 'orgNode', data: { label: 'مساعد نائب الرئيس للشؤون الإدارية', color: 'orange-light' }, position: { x: -540, y: 550 } },
  { id: '17', type: 'orgNode', data: { label: 'مساعد نائب الرئيس للشؤون المالية', color: 'orange-light' }, position: { x: -180, y: 550 } },
  { id: '18', type: 'orgNode', data: { label: 'مساعد نائب الرئيس للشؤون الأكاديمية', color: 'orange-light' }, position: { x: 900, y: 550 } },
  { id: '19', type: 'orgNode', data: { label: 'المساعد المالي لنائب الرئيس لشؤون القطاع', color: 'orange-light' }, position: { x: 2340, y: 550 } },

  // Admin branch
  { id: '20', type: 'orgNode', data: { label: 'رئيس وحدة الهندسة والإنشاءات', color: 'peach' }, position: { x: -900, y: 700 } },
  { id: '21', type: 'orgNode', data: { label: 'رئيس الديوان المركزي', color: 'peach' }, position: { x: -630, y: 700 } },
  { id: '22', type: 'orgNode', data: { label: 'مدير دائرة اللوازم والمشتريات', color: 'peach' }, position: { x: -360, y: 700 } },
  { id: '23', type: 'orgNode', data: { label: 'مدير دائرة الموارد البشرية', color: 'peach' }, position: { x: -90, y: 700 } },
  { id: '24', type: 'orgNode', data: { label: 'مدير مركز تكنولوجيا المعلومات والاتصالات', color: 'peach' }, position: { x: 180, y: 700 } },

  // Finance branch
  { id: '25', type: 'orgNode', data: { label: 'المدير المالي', color: 'blue-light' }, position: { x: -180, y: 700 } },

  // Academic branch - Deans
  { id: '26', type: 'orgNode', data: { label: 'عميد كلية الزراعة', color: 'blue-light' }, position: { x: -180, y: 700 } },
  { id: '27', type: 'orgNode', data: { label: 'عميد كلية الإعلام', color: 'blue-light' }, position: { x: 90, y: 700 } },
  { id: '28', type: 'orgNode', data: { label: 'عميد كلية الآداب', color: 'blue-light' }, position: { x: 360, y: 700 } },
  { id: '29', type: 'orgNode', data: { label: 'عميد كلية التنمية الاجتماعية والأسرية', color: 'blue-light' }, position: { x: 630, y: 700 } },
  { id: '30', type: 'orgNode', data: { label: 'عميد كلية التكنولوجيا والعلوم التطبيقية', color: 'blue-light' }, position: { x: 900, y: 700 } },
  { id: '31', type: 'orgNode', data: { label: 'عميد كلية العلوم الإدارية والاقتصادية', color: 'blue-light' }, position: { x: 1170, y: 700 } },
  { id: '32', type: 'orgNode', data: { label: 'عميد كلية العلوم التربوية', color: 'blue-light' }, position: { x: 1440, y: 700 } },
  { id: '33', type: 'orgNode', data: { label: 'عميد القبول والتسجيل والامتحانات', color: 'blue-light' }, position: { x: 1710, y: 700 } },
  { id: '34', type: 'orgNode', data: { label: 'عميد الدراسات العليا', color: 'blue-light' }, position: { x: 1980, y: 700 } },
  { id: '35', type: 'orgNode', data: { label: 'عميد البحث العلمي', color: 'blue-light' }, position: { x: 2250, y: 700 } },

  // Centers under Deans
  { id: '36', type: 'orgNode', data: { label: 'مدير مركز البحوث الزراعية', color: 'peach' }, position: { x: -180, y: 850 } },
  { id: '37', type: 'orgNode', data: { label: 'مدير مركز التراث الشعبي', color: 'peach' }, position: { x: 360, y: 850 } },
  { id: '38', type: 'orgNode', data: { label: 'مركز الأبحاث الاقتصادية والإدارية', color: 'peach' }, position: { x: 1170, y: 850 } },
  
  // Centers under Academic VP line directly
  { id: '39', type: 'orgNode', data: { label: 'مدير مركز التعليم الدولي', color: 'peach' }, position: { x: 1800, y: 850 } },
  { id: '40', type: 'orgNode', data: { label: 'مدير دائرة المناهج والمقررات الدراسية', color: 'peach' }, position: { x: 2070, y: 850 } },
  { id: '41', type: 'orgNode', data: { label: 'مدير مركز التعليم المستمر وخدمة المجتمع', color: 'peach' }, position: { x: 2340, y: 850 } },
  { id: '42', type: 'orgNode', data: { label: 'أمين المكتبة المركزية', color: 'peach' }, position: { x: 2610, y: 850 } },
  { id: '43', type: 'orgNode', data: { label: 'مدير مركز التعليم الرقمي', color: 'peach' }, position: { x: 2880, y: 850 } },
];

export const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', type: 'step', style: { strokeWidth: 3, stroke: '#000', strokeDasharray: '5,5' } },
  { id: 'e2-3', source: '2', target: '3', type: 'step', sourceHandle: 'right-source', targetHandle: 'left-target', style: { strokeWidth: 3, stroke: '#000' } },
  
  // Dotted lines to side staff
  { id: 'e2-4', source: '2', target: '4', type: 'step', sourceHandle: 'left-source', animated: true, style: { strokeWidth: 2, stroke: '#666', strokeDasharray: '5,5' } },
  { id: 'e4-5', source: '4', target: '5', type: 'step', animated: true, style: { strokeWidth: 2, stroke: '#666', strokeDasharray: '5,5' } },
  { id: 'e2-6', source: '2', target: '6', type: 'step', sourceHandle: 'right-source', animated: true, style: { strokeWidth: 2, stroke: '#666', strokeDasharray: '5,5' } },
  { id: 'e6-7', source: '6', target: '7', type: 'step', animated: true, style: { strokeWidth: 2, stroke: '#666', strokeDasharray: '5,5' } },

  // President drops to routing node
  { id: 'e2-rn', source: '2', target: 'rn-pres-trunk', type: 'step', style: { strokeWidth: 3, stroke: '#000' } },
  
  // Routing node distributes to VPs
  { id: 'rn-8', source: 'rn-pres-trunk', target: '8', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rn-9', source: 'rn-pres-trunk', target: '9', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rn-10', source: 'rn-pres-trunk', target: '10', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rn-11', source: 'rn-pres-trunk', target: '11', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rn-12', source: 'rn-pres-trunk', target: '12', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rn-13', source: 'rn-pres-trunk', target: '13', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rn-14', source: 'rn-pres-trunk', target: '14', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rn-15', source: 'rn-pres-trunk', target: '15', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },

  // VP Admin to its routing node
  { id: 'e8-16', source: '8', target: '16', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'e8-rnad', source: '8', target: 'rn-vp-admin-trunk', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rnad-20', source: 'rn-vp-admin-trunk', target: '20', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rnad-21', source: 'rn-vp-admin-trunk', target: '21', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rnad-22', source: 'rn-vp-admin-trunk', target: '22', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rnad-23', source: 'rn-vp-admin-trunk', target: '23', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rnad-24', source: 'rn-vp-admin-trunk', target: '24', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },

  // VP Finance
  { id: 'e9-17', source: '9', target: '17', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'e9-25', source: '9', target: '25', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },

  // VP Academic to routing node
  { id: 'e10-18', source: '10', target: '18', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'e10-rnac', source: '10', target: 'rn-vp-acad-trunk', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rnac-26', source: 'rn-vp-acad-trunk', target: '26', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rnac-27', source: 'rn-vp-acad-trunk', target: '27', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rnac-28', source: 'rn-vp-acad-trunk', target: '28', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rnac-29', source: 'rn-vp-acad-trunk', target: '29', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rnac-30', source: 'rn-vp-acad-trunk', target: '30', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rnac-31', source: 'rn-vp-acad-trunk', target: '31', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rnac-32', source: 'rn-vp-acad-trunk', target: '32', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rnac-33', source: 'rn-vp-acad-trunk', target: '33', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rnac-34', source: 'rn-vp-acad-trunk', target: '34', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rnac-35', source: 'rn-vp-acad-trunk', target: '35', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  
  // Academic VP Centers also branch from trunk
  { id: 'rnac-39', source: 'rn-vp-acad-trunk', target: '39', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rnac-40', source: 'rn-vp-acad-trunk', target: '40', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rnac-41', source: 'rn-vp-acad-trunk', target: '41', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rnac-42', source: 'rn-vp-acad-trunk', target: '42', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'rnac-43', source: 'rn-vp-acad-trunk', target: '43', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },

  // Sub-centers under deans
  { id: 'e26-36', source: '26', target: '36', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'e28-37', source: '28', target: '37', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
  { id: 'e31-38', source: '31', target: '38', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },

  // VP Gaza
  { id: 'e13-19', source: '13', target: '19', type: 'step', style: { strokeWidth: 2, stroke: '#000' } },
];
