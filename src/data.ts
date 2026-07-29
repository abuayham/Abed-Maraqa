export interface TreeNode {
  id: string;
  title: string;
  color?: string;
  children?: TreeNode[];
  isSideStaff?: boolean; // For nodes that hang off the side of the parent line
  isDashedLine?: boolean; // For dashed connection lines
  isAssistant?: boolean; // For assistant roles that have the departments hanging under them
  isCollapsed?: boolean; // For nodes that are collapsed by default
}

export const initialTreeData: TreeNode = {
  id: 'board',
  title: 'مجلس الأمناء',
  color: 'green-dark',
  children: [
    {
      id: 'audit',
      title: 'مدير دائرة التدقيق الداخلي',
      color: 'green-light',
      isSideStaff: true, // Left side
      isDashedLine: true,
      children: [
        {
          id: 'advisor',
          title: 'مستشار رئيس الجامعة',
          color: 'green-light',
          isSideStaff: true,
          isDashedLine: true,
        }
      ]
    },
    {
      id: 'president',
      title: 'رئيس الجامعة',
      color: 'green-dark',
      children: [
        {
          id: 'univ-council',
          title: 'مجلس الجامعة',
          color: 'green-dark',
          isSideStaff: true // Right side
        },
        {
          id: 'asst-pres',
          title: 'مساعد رئيس الجامعة',
          color: 'green-light',
          isSideStaff: true, // Right side
          children: [
            {
              id: 'amman-office',
              title: 'مدير مكتب ارتباط عمان',
              color: 'green-light',
              isSideStaff: true // Right side
            }
          ]
        },
        {
          id: 'vp-admin',
          title: 'نائب رئيس الجامعة للشؤون الإدارية',
          color: 'orange',
          children: [
            {
              id: 'asst-vp-admin',
              title: 'مساعد نائب الرئيس للشؤون الإدارية',
              color: 'orange-light',
              isAssistant: true,
              children: [
                { id: 'diwan', title: 'رئيس الديوان المركزي', color: 'orange-light' },
                { id: 'procurement', title: 'مدير دائرة اللوازم والمشتريات', color: 'orange-light' },
                { id: 'hr', title: 'مدير دائرة الموارد البشرية', color: 'orange-light' },
                { id: 'engineering', title: 'رئيس وحدة الهندسة والإنشاءات', color: 'orange-light' },
                { id: 'it-center', title: 'مدير مركز تكنولوجيا المعلومات والاتصالات', color: 'orange-light' }
              ]
            }
          ]
        },
        {
          id: 'vp-finance',
          title: 'نائب رئيس الجامعة للشؤون المالية',
          color: 'orange',
          children: [
            {
              id: 'asst-vp-finance',
              title: 'مساعد نائب الرئيس للشؤون المالية',
              color: 'orange-light',
              isAssistant: true,
              children: [
                { id: 'finance-dir', title: 'المدير المالي', color: 'orange-light' }
              ]
            }
          ]
        },
        {
          id: 'vp-academic',
          title: 'نائب رئيس الجامعة للشؤون الأكاديمية',
          color: 'orange',
          children: [
            {
              id: 'asst-vp-academic',
              title: 'مساعد نائب الرئيس للشؤون الأكاديمية',
              color: 'orange-light',
              isAssistant: true,
              children: [
                {
                  id: 'dean-agri', title: 'عميد كلية الزراعة', color: 'blue-light',
                  children: [ { id: 'agri-center', title: 'مدير مركز البحوث الزراعية', color: 'peach' } ]
                },
                { id: 'dean-media', title: 'عميد كلية الإعلام', color: 'blue-light' },
                {
                  id: 'dean-arts', title: 'عميد كلية الآداب', color: 'blue-light',
                  children: [ { id: 'folk-center', title: 'مدير مركز التراث الشعبي "جفرا"', color: 'peach' } ]
                },
                { id: 'dean-social', title: 'عميد كلية التنمية الاجتماعية والأسرية', color: 'blue-light' },
                { id: 'dean-tech', title: 'عميد كلية التكنولوجيا والعلوم التطبيقية', color: 'blue-light' },
                {
                  id: 'dean-econ', title: 'عميد كلية العلوم الإدارية والاقتصادية', color: 'blue-light',
                  children: [ { id: 'econ-center', title: 'مركز الأبحاث الاقتصادية والإدارية', color: 'peach' } ]
                },
                { id: 'dean-edu', title: 'عميد كلية العلوم التربوية', color: 'blue-light' },
                { id: 'dean-exams', title: 'عميد القبول والتسجيل والامتحانات', color: 'blue-light' },
                { id: 'dean-grad', title: 'عميد الدراسات العليا', color: 'blue-light' },
                {
                  id: 'dean-research', title: 'عميد البحث العلمي', color: 'blue-light',
                  children: [
                    { id: 'curriculum', title: 'مدير دائرة المناهج والمقررات الدراسية', color: 'peach' },
                    { id: 'intl-edu', title: 'مدير مركز التعليم الدولي', color: 'peach' },
                    { id: 'cont-edu', title: 'مدير مركز التعليم المستمر وخدمة المجتمع', color: 'peach' },
                    { id: 'library', title: 'أمين المكتبة المركزية', color: 'peach' },
                    { id: 'digital', title: 'مدير مركز التعليم الرقمي', color: 'peach' }
                  ]
                }
              ]
            }
          ]
        },
        { id: 'quality', title: 'مدير دائرة التخطيط والجودة', color: 'teal' },
        { id: 'branches', title: 'مدراء الفروع', color: 'orange' },
        {
          id: 'vp-gaza', title: 'نائب رئيس الجامعة لشؤون قطاع غزة', color: 'orange',
          children: [
            { id: 'asst-vp-gaza', title: 'المساعد المالي لنائب الرئيس لشؤون القطاع', color: 'orange-light', isAssistant: true }
          ]
        },
        { id: 'pr', title: 'مدير دائرة العلاقات العامة والدولية والإعلام', color: 'teal' },
        { id: 'student-affairs', title: 'عميد شؤون الطلبة', color: 'teal' }
      ]
    }
  ]
};