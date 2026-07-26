export interface OrgNode {
  id: string;
  title: string;
  color: string;
  position?: { x: number, y: number };
  children?: OrgNode[];
  leftStaff?: OrgNode[];
  rightStaff?: OrgNode[];
  leftSibling?: OrgNode;
  dashedDown?: boolean;
  textAlign?: 'right' | 'center' | 'left';
  lineStyle?: 'solid' | 'dashed';
  showArrow?: boolean;
}

export const initialData: OrgNode = {
  id: 'root',
  title: 'مجلس الأمناء',
  color: 'green-dark',
  position: { x: 0, y: 0 },
  children: [
    {
      id: 'president',
      title: 'رئيس الجامعة',
      color: 'green-dark',
      lineStyle: 'dashed',
      position: { x: 0, y: 150 },
      leftSibling: {
        id: 'university-council',
        title: 'مجلس الجامعة',
        color: 'green-dark',
        position: { x: -300, y: 150 }
      },
      leftStaff: [
        { id: 'audit', title: 'مدير دائرة التدقيق الداخلي', color: 'green-light', lineStyle: 'dashed', position: { x: 300, y: 250 } },
        { id: 'advisor', title: 'مستشار رئيس الجامعة', color: 'green-light', lineStyle: 'dashed', position: { x: 300, y: 350 } },
      ],
      rightStaff: [
        { id: 'assistant-pres', title: 'مساعد رئيس الجامعة', color: 'green-light', position: { x: -300, y: 250 } },
        { id: 'amman-office', title: 'مدير مكتب ارتباط عمان', color: 'green-light', position: { x: -300, y: 350 } },
      ],
      children: [
        {
          id: 'vp-admin',
          title: 'نائب رئيس الجامعة
للشؤون الإدارية',
          color: 'orange',
          position: { x: 1600, y: 500 },
          children: [
            { id: 'vp-admin-asst', title: 'مساعد نائب الرئيس للشؤون الإدارية', color: 'orange-light', position: { x: 1450, y: 650 } },
            { id: 'it-center', title: 'مدير مركز تكنولوجيا المعلومات', color: 'orange-light', position: { x: 1300, y: 900 } },
            { id: 'hr', title: 'مدير دائرة الموارد البشرية', color: 'orange-light', position: { x: 1450, y: 900 } },
            { id: 'procurement', title: 'مدير دائرة اللوازم والمشتريات', color: 'orange-light', position: { x: 1600, y: 900 } },
            { id: 'registry', title: 'رئيس الديوان المركزي', color: 'orange-light', position: { x: 1750, y: 900 } },
            { id: 'engineering', title: 'رئيس وحدة الهندسة والإنشاءات', color: 'orange-light', position: { x: 1900, y: 900 } },
          ]
        },
        {
          id: 'vp-finance',
          title: 'نائب رئيس الجامعة
للشؤون المالية',
          color: 'orange',
          position: { x: 1150, y: 500 },
          children: [
            { id: 'vp-finance-asst', title: 'مساعد نائب الرئيس للشؤون المالية', color: 'orange-light', position: { x: 1000, y: 650 } },
            { id: 'finance-dir', title: 'المدير المالي', color: 'orange-light', position: { x: 1150, y: 900 } },
          ]
        },
        {
          id: 'vp-academic',
          title: 'نائب رئيس الجامعة
للشؤون الأكاديمية',
          color: 'orange',
          position: { x: 200, y: 500 },
          children: [
            { id: 'vp-acad-asst', title: 'مساعد نائب الرئيس للشؤون الأكاديمية', color: 'orange-light', position: { x: 50, y: 650 } },
            { id: 'dean-agri', title: 'عميد كلية الزراعة', color: 'blue-light', position: { x: 900, y: 800 }, children: [{ id: 'agri-center', title: 'مدير مركز البحوث الزراعية', color: 'peach', position: { x: 900, y: 950 } }] },
            { id: 'dean-media', title: 'عميد كلية الإعلام', color: 'blue-light', position: { x: 750, y: 800 } },
            { id: 'dean-arts', title: 'عميد كلية الآداب', color: 'blue-light', position: { x: 600, y: 800 }, children: [{ id: 'folk-center', title: 'مدير مركز التراث الشعبي جفرا', color: 'peach', position: { x: 600, y: 950 } }] },
            { id: 'dean-social', title: 'عميد كلية التنمية الاجتماعية والأسرية', color: 'blue-light', position: { x: 450, y: 800 } },
            { id: 'dean-tech', title: 'عميد كلية التكنولوجيا والعلوم التطبيقية', color: 'blue-light', position: { x: 300, y: 800 } },
            { id: 'dean-econ', title: 'عميد كلية العلوم الإدارية والاقتصادية', color: 'blue-light', position: { x: 150, y: 800 }, children: [{ id: 'econ-center', title: 'مركز الأبحاث الاقتصادية والإدارية', color: 'peach', position: { x: 150, y: 950 } }] },
            { id: 'dean-edu', title: 'عميد كلية العلوم التربوية', color: 'blue-light', position: { x: 0, y: 800 } },
            { id: 'dean-reg', title: 'عميد القبول والتسجيل والامتحانات', color: 'blue-light', position: { x: -150, y: 800 } },
            { id: 'dean-grad', title: 'عميد الدراسات العليا', color: 'blue-light', position: { x: -300, y: 800 } },
            { id: 'dean-research', title: 'عميد البحث العلمي', color: 'blue-light', position: { x: -450, y: 800 }, children: [
              { id: 'curriculum', title: 'مدير دائرة المناهج والمقررات الدراسية', color: 'peach', position: { x: -375, y: 950 } },
              { id: 'cont-edu', title: 'مدير مركز التعليم المستمر وخدمة المجتمع', color: 'peach', position: { x: -525, y: 950 } },
            ]},
          ]
        },
        {
          id: 'quality',
          title: 'مدير دائرة التخطيط والجودة',
          color: 'teal',
          position: { x: -650, y: 500 }
        },
        {
          id: 'branch-dirs',
          title: 'مدراء الفروع',
          color: 'orange',
          position: { x: -800, y: 500 },
          children: [
            { id: 'intl-edu', title: 'مدير مركز التعليم الدولي', color: 'peach', position: { x: -650, y: 900 } },
            { id: 'library', title: 'أمين المكتبة المركزية', color: 'peach', position: { x: -800, y: 900 } },
            { id: 'digital-edu', title: 'مدير مركز التعليم الرقمي', color: 'peach', position: { x: -950, y: 900 } },
          ]
        },
        {
          id: 'vp-gaza',
          title: 'نائب رئيس الجامعة
لشؤون قطاع غزة',
          color: 'orange',
          position: { x: -1150, y: 500 },
          children: [
            { id: 'gaza-finance-asst', title: 'المساعد المالي لنائب الرئيس لشؤون القطاع', color: 'orange-light', position: { x: -1300, y: 650 } },
          ]
        },
        {
          id: 'pr',
          title: 'مدير دائرة العلاقات العامة والدولية والاعلام',
          color: 'teal',
          position: { x: -1450, y: 500 }
        },
        {
          id: 'student-affairs',
          title: 'عميد شؤون الطلبة',
          color: 'teal',
          position: { x: -1650, y: 500 }
        }
      ]
    }
  ]
};