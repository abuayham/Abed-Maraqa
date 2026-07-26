export interface OrgNode {
  id: string;
  title: string;
  color: string;
  children?: OrgNode[];
  // Side nodes connected with horizontal lines to this node
  leftStaff?: OrgNode[];   // connected via dashed line from LEFT side (like مدير دائرة التدقيق)
  rightStaff?: OrgNode[];  // connected via solid line from RIGHT side (like مساعد رئيس الجامعة)
  leftSibling?: OrgNode;   // same level connected with solid horizontal line on left (like مجلس الجامعة)
  dashedDown?: boolean;    // dashed vertical line going down to this node
  textAlign?: 'right' | 'center' | 'left';
  lineStyle?: 'solid' | 'dashed';
  showArrow?: boolean;
}

export const initialData: OrgNode = {
  id: 'root',
  title: 'مجلس الأمناء',
  color: 'green-dark',
  children: [
    {
      id: 'president',
      title: 'رئيس الجامعة',
      color: 'green-dark',
      dashedDown: true,
      leftSibling: {
        id: 'university-council',
        title: 'مجلس الجامعة',
        color: 'green-dark',
      },
      leftStaff: [
        { id: 'audit', title: 'مدير دائرة التدقيق الداخلي', color: 'green-light' },
        { id: 'advisor', title: 'مستشار رئيس الجامعة', color: 'green-light' },
      ],
      rightStaff: [
        { id: 'assistant-pres', title: 'مساعد رئيس الجامعة', color: 'green-light' },
        { id: 'amman-office', title: 'مدير مكتب ارتباط عمان', color: 'green-light' },
      ],
      children: [
        {
          id: 'vp-admin',
          title: 'نائب رئيس الجامعة\nللشؤون الإدارية',
          color: 'orange',
          children: [
            { id: 'vp-admin-asst', title: 'مساعد نائب الرئيس للشؤون الإدارية', color: 'orange-light' },
            { id: 'it-center', title: 'مدير مركز تكنولوجيا المعلومات', color: 'orange-light' },
            { id: 'hr', title: 'مدير دائرة الموارد البشرية', color: 'orange-light' },
            { id: 'procurement', title: 'مدير دائرة اللوازم والمشتريات', color: 'orange-light' },
            { id: 'registry', title: 'رئيس الديوان المركزي', color: 'orange-light' },
            { id: 'engineering', title: 'رئيس وحدة الهندسة والإنشاءات', color: 'orange-light' },
          ]
        },
        {
          id: 'vp-finance',
          title: 'نائب رئيس الجامعة\nللشؤون المالية',
          color: 'orange',
          children: [
            { id: 'vp-finance-asst', title: 'مساعد نائب الرئيس للشؤون المالية', color: 'orange-light' },
            { id: 'finance-dir', title: 'المدير المالي', color: 'orange-light' },
          ]
        },
        {
          id: 'vp-academic',
          title: 'نائب رئيس الجامعة\nللشؤون الأكاديمية',
          color: 'orange',
          children: [
            { id: 'vp-acad-asst', title: 'مساعد نائب الرئيس للشؤون الأكاديمية', color: 'orange-light' },
            { id: 'dean-agri', title: 'عميد كلية الزراعة', color: 'blue-light', children: [{ id: 'agri-center', title: 'مدير مركز البحوث الزراعية', color: 'peach' }] },
            { id: 'dean-media', title: 'عميد كلية الإعلام', color: 'blue-light' },
            { id: 'dean-arts', title: 'عميد كلية الآداب', color: 'blue-light', children: [{ id: 'folk-center', title: 'مدير مركز التراث الشعبي جفرا', color: 'peach' }] },
            { id: 'dean-social', title: 'عميد كلية التنمية الاجتماعية والأسرية', color: 'blue-light' },
            { id: 'dean-tech', title: 'عميد كلية التكنولوجيا والعلوم التطبيقية', color: 'blue-light' },
            { id: 'dean-econ', title: 'عميد كلية العلوم الإدارية والاقتصادية', color: 'blue-light', children: [{ id: 'econ-center', title: 'مركز الأبحاث الاقتصادية والإدارية', color: 'peach' }] },
            { id: 'dean-edu', title: 'عميد كلية العلوم التربوية', color: 'blue-light' },
            { id: 'dean-reg', title: 'عميد القبول والتسجيل والامتحانات', color: 'blue-light' },
            { id: 'dean-grad', title: 'عميد الدراسات العليا', color: 'blue-light' },
            { id: 'dean-research', title: 'عميد البحث العلمي', color: 'blue-light', children: [
              { id: 'curriculum', title: 'مدير دائرة المناهج والمقررات الدراسية', color: 'peach' },
              { id: 'cont-edu', title: 'مدير مركز التعليم المستمر وخدمة المجتمع', color: 'peach' },
            ]},
          ]
        },
        {
          id: 'branch-dirs',
          title: 'مدراء الفروع',
          color: 'orange',
          children: [
            { id: 'digital-edu', title: 'مدير مركز التعليم الرقمي', color: 'peach' },
            { id: 'library', title: 'أمين المكتبة المركزية', color: 'peach' },
            { id: 'intl-edu', title: 'مدير مركز التعليم الدولي', color: 'peach' },
          ]
        },
        {
          id: 'quality',
          title: 'مدير دائرة التخطيط والجودة',
          color: 'teal'
        },
        {
          id: 'vp-gaza',
          title: 'نائب رئيس الجامعة\nلشؤون قطاع غزة',
          color: 'orange',
          children: [
            { id: 'gaza-finance-asst', title: 'المساعد المالي لنائب الرئيس لشؤون القطاع', color: 'orange-light' },
          ]
        },
        {
          id: 'pr',
          title: 'مدير دائرة العلاقات العامة والدولية والاعلام',
          color: 'teal'
        },
        {
          id: 'student-affairs',
          title: 'عميد شؤون الطلبة',
          color: 'teal'
        }
      ]
    }
  ]
};
