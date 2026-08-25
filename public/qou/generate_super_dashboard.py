import os
import glob
import re
import unicodedata
import pandas as pd
import pdfplumber
from collections import Counter

DAYS_OF_WEEK = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
WORKING_DAYS = 125

def load_branch_employees():
    branch_employees = {
        "الإدارة العامة - القدس": 25,
        "الإدارة العامة - البيرة": 178,
        "عمادة الدراسات العليا والبحث العلمي": 20,
        "فرع القدس": 24,
        "فرع نابلس": 90,
        "فرع قلقيلية": 46,
        "فرع سلفيت": 44,
        "فرع طوباس": 34,
        "فرع رام الله والبيرة": 82,
        "فرع أريحا": 20,
        "فرع أريحا": 20,
        "فرع اريحا": 20,
        "فرع بيت لحم": 51,
        "فرع الخليل": 60,
        "فرع دورا": 26,
        "فرع يطا": 24,
        "فرع جنين": 96,
        "فرع طولكرم": 70,
        "مركز التعليم المستمر وخدمة المجتمع": 7,
        "شؤون الطلبة": 8,
        "مركز تكنولوجيا المعلومات": 20,
        "مكاتب الادارة- الإرسال": 12,
        "ادارة الشؤون الاكاديمية - البيرة": 2,
        "مجلس الامناء": 1,
        "عمادة القبول والتسجيل والامتحانات": 23,
        "كلية العلوم التربوية": 1,
        "كلية العلوم الادارية والاقتصادية": 1,
        "كلية التنمية الاجتماعية والاسرية": 1,
        "كلية التكنولوجيا والعلوم التطبيقية": 1,
        "كلية الآداب": 1,
        "كلية الإعلام": 2,
        "وحدة الهندسة والانشاءات": 1,
        "كلية الزراعة": 6,
        "دائرة التخطيط والجودة": 6,
        "العلاقات العامة": 8,
        "البرنامج الدولي": 6,
        "مركز التعليم الرقمي": 10,
        "دائرة التدقيق الداخلي": 2,
        "وحدة الشراكات وتنمية الموارد": 5,
    }
    return branch_employees

BRANCH_EMPLOYEES = load_branch_employees()

def get_branch_total_employees(branch_name):
    """يرجع عدد موظفي الفرع."""
    # First exact match
    if branch_name in BRANCH_EMPLOYEES:
        return BRANCH_EMPLOYEES[branch_name]
    
    # Then fuzzy match
    for key, val in BRANCH_EMPLOYEES.items():
        if key in branch_name or branch_name in key:
            return val
            
    # Default to 0 for unknown
    return 0

def extract_comprehensive_data():
    files = glob.glob("*.pdf")
    all_employees = []
    branches_stats = {}
    
    for filepath in files:
        branch_name = os.path.basename(filepath).replace('.pdf', '')
        branch_name = branch_name.replace("يــطـــا", "يطا").replace("فـــرع", "فرع").replace("  ", " ").strip()
        branch_name = branch_name.replace("البيره", "البيرة").replace("والجوده", "والجودة").replace("عماده", "عمادة")
        branch_name = branch_name.replace("الإمتحانات", "الامتحانات")
        branch_name = branch_name.replace("_compressed", "").replace(" (1)", "").replace("مركز تكنولوجيا المعلومات ", "مركز تكنولوجيا المعلومات")
        employees_dict = {}
        current_employee_name = None
        
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                last_month_seen = "01"
                
                if text:
                    lines = text.split('\n')
                    for line in lines:
                        rev_line = unicodedata.normalize('NFKC', line[::-1])
                        
                        # Find dates to use as fallback month
                        d_match = re.search(r'\d{2}/(\d{2})/\d{4}', line)
                        if d_match:
                            last_month_seen = d_match.group(1)
                            
                        if "الموظف:" in rev_line and "عدد التأخيرات:" in rev_line:
                            match = re.search(r"الموظف:\s*(.*?)\s*عدد التأخيرات:", rev_line)
                            if match:
                                name = match.group(1).strip()
                                if name in ["ماهر عبد الحميد يونس أبو ساكور", "محمد سعدي عبد الرحمن ابو ساكور", "محمد سعدي عبد الرحمن أبو ساكور"]:
                                    current_employee_name = None
                                    continue
                                current_employee_name = name
                                if name not in employees_dict:
                                    employees_dict[name] = {
                                        'الفرع': branch_name,
                                        'اسم الموظف': name,
                                        'دقائق_الشهور': {str(i).zfill(2): 0 for i in range(1, 13)},
                                        'حالات_الشهور': {str(i).zfill(2): 0 for i in range(1, 13)},
                                        'أيام_الشهور': {str(i).zfill(2): {d: 0 for d in DAYS_OF_WEEK} for i in range(1, 13)},
                                        'إجمالي_أيام': {d: 0 for d in DAYS_OF_WEEK}
                                    }
                        
                        # Parse table rows directly from text lines
                        parts = line.split()
                        if len(parts) >= 3 and parts[0].isdigit() and re.match(r'\d{2}/\d{2}/\d{4}', parts[-1]):
                            minutes = int(parts[0])
                            day_str = unicodedata.normalize('NFKC', parts[1][::-1]).strip()
                            day_str = day_str.replace('أ', 'ا').replace('إ', 'ا')
                            
                            date_str = parts[-1]
                            month = date_str.split('/')[1]
                            
                            if current_employee_name is not None:
                                if month in employees_dict[current_employee_name]['دقائق_الشهور']:
                                    employees_dict[current_employee_name]['دقائق_الشهور'][month] += minutes
                                    employees_dict[current_employee_name]['حالات_الشهور'][month] += 1
                                    
                                    # Match day
                                    for valid_day in DAYS_OF_WEEK:
                                        if valid_day.replace('أ', 'ا').replace('إ', 'ا') in day_str:
                                            employees_dict[current_employee_name]['إجمالي_أيام'][valid_day] += 1
                                            employees_dict[current_employee_name]['أيام_الشهور'][month][valid_day] += 1
                                            break

        # Aggregate data
        branch_total_mins = 0
        branch_total_delays = 0
        branch_days = {d: 0 for d in DAYS_OF_WEEK}
        top_emp = None
        top_cases = -1
        
        for e in employees_dict.values():
            e['إجمالي الدقائق'] = sum(e['دقائق_الشهور'].values())
            e['إجمالي حالات التأخير'] = sum(e['حالات_الشهور'].values())
            e['إجمالي الساعات'] = round(e['إجمالي الدقائق'] / 60, 2)
            e['متوسط دقائق التأخير'] = round(e['إجمالي الدقائق'] / e['إجمالي حالات التأخير'], 2) if e['إجمالي حالات التأخير'] > 0 else 0
            
            e['إجمالي_أيام'] = {d: 0 for d in DAYS_OF_WEEK}
            for m_days in e['أيام_الشهور'].values():
                for d, c in m_days.items():
                    e['إجمالي_أيام'][d] += c
                    branch_days[d] += c
            
            recorded_months = [m for m, val in e['حالات_الشهور'].items() if val > 0]
            e['الأشهر المسجلة'] = "، ".join(sorted(recorded_months)) if recorded_months else "غير محدد"
            e['اليوم الأكثر تكراراً'] = max(e['إجمالي_أيام'], key=e['إجمالي_أيام'].get) if sum(e['إجمالي_أيام'].values()) > 0 else "لا يوجد"
            
            branch_total_mins += e['إجمالي الدقائق']
            branch_total_delays += e['إجمالي حالات التأخير']
            
            if e['إجمالي حالات التأخير'] > top_cases:
                top_cases = e['إجمالي حالات التأخير']
                top_emp = e['اسم الموظف']
                
            all_employees.append(e)
            
        total_emps = get_branch_total_employees(branch_name)
        branches_stats[branch_name] = {
            'الفرع': branch_name,
            'إجمالي الدقائق': branch_total_mins,
            'إجمالي الساعات': round(branch_total_mins / 60, 2),
            'متوسط دقائق التأخير': round(branch_total_mins / branch_total_delays, 2) if branch_total_delays > 0 else 0,
            'إجمالي الموظفين المتأخرين': len(employees_dict),
            'إجمالي موظفي الفرع': total_emps,
            'نسبة المتأخرين %': round(len(employees_dict) / total_emps * 100, 1) if total_emps > 0 else 0,
            'الموظف الأكثر تأخيراً': f"{top_emp} ({top_cases} حالة)" if top_emp else "لا يوجد",
            'إجمالي حالات التأخير': branch_total_delays,
            'اليوم الأكثر تكراراً': max(branch_days, key=branch_days.get) if sum(branch_days.values()) > 0 else "لا يوجد"
        }

    return all_employees, list(branches_stats.values())

def create_super_dashboard():
    employees, branches_stats = extract_comprehensive_data()
    employees = sorted(employees, key=lambda x: x['إجمالي حالات التأخير'], reverse=True)
    branches_stats = sorted(branches_stats, key=lambda x: x['إجمالي حالات التأخير'], reverse=True)
    branches = [b['الفرع'] for b in branches_stats]
    
    excel_path = os.path.abspath('لوحة_القيادة_الاحترافية_النهائية_v3.xlsx')
    writer = pd.ExcelWriter(excel_path, engine='xlsxwriter')
    workbook = writer.book
    
    title_format = workbook.add_format({'bold': True, 'font_color': 'white', 'bg_color': '#1E3A8A', 'font_size': 16, 'align': 'center', 'valign': 'vcenter', 'border': 1})
    header_fmt = workbook.add_format({'bold': True, 'font_color': 'white', 'bg_color': '#2563EB', 'border': 1, 'align': 'center', 'valign': 'vcenter'})
    cell_fmt = workbook.add_format({'border': 1, 'align': 'center', 'valign': 'vcenter'})
    bg_color = '#F3F4F6'
    kpi_title_fmt = workbook.add_format({'bold': True, 'font_size': 12, 'font_color': '#4B5563', 'bg_color': 'white', 'align': 'center', 'valign': 'vcenter', 'border': 1})
    kpi_val_fmt = workbook.add_format({'bold': True, 'font_size': 18, 'font_color': '#1E3A8A', 'bg_color': 'white', 'align': 'center', 'valign': 'vcenter', 'border': 1})
    dropdown_label_fmt = workbook.add_format({'bold': True, 'font_size': 12, 'bg_color': bg_color, 'align': 'left', 'valign': 'vcenter'})
    dropdown_cell_fmt = workbook.add_format({'border': 1, 'bg_color': 'white', 'align': 'center', 'valign': 'vcenter', 'bold': True})

    # 1. Settings Sheet
    ws_settings = workbook.add_worksheet('الإعدادات')
    ws_settings.right_to_left()
    ws_settings.set_tab_color('#8B5CF6')
    
    ws_settings.write('A1', 'إعدادات عامة', header_fmt)
    ws_settings.write('A2', 'أيام الدوام الفعلي', cell_fmt)
    ws_settings.write('B2', 125, cell_fmt)
    
    ws_settings.write('D1', 'أعداد موظفي الفروع والدوائر', header_fmt)
    ws_settings.write('D2', 'الفرع / الدائرة', header_fmt)
    ws_settings.write('E2', 'إجمالي الموظفين', header_fmt)
    
    row_idx = 2
    for b_name, b_count in BRANCH_EMPLOYEES.items():
        ws_settings.write(row_idx, 3, b_name, cell_fmt)
        ws_settings.write(row_idx, 4, b_count, cell_fmt)
        row_idx += 1
        
    ws_settings.set_column('A:A', 25)
    ws_settings.set_column('B:B', 15)
    ws_settings.set_column('D:D', 35)
    ws_settings.set_column('E:E', 20)

    # 2. Lists Sheet
    ws_lists = workbook.add_worksheet('قوائم_النطاقات')
    ws_lists.write_column('A1', ['الكل'] + branches)
    ws_lists.write_column('B1', ['الكل'] + [str(i).zfill(2) for i in range(1, 13)])
    ws_lists.hide()

    # 2. Hidden Data
    ws_data = workbook.add_worksheet('البيانات_الأساسية')
    headers = ['الفرع', 'اسم الموظف', 'إجمالي الدقائق', 'إجمالي حالات التأخير', 'إجمالي الساعات', 'متوسط دقائق التأخير', 'الأشهر المسجلة', 'نسبة_التأخير', 'Match_Flag', 'Running_Count']
    headers += [f'دقائق_{str(i).zfill(2)}' for i in range(1, 13)]
    headers += [f'حالات_{str(i).zfill(2)}' for i in range(1, 13)]
    
    # Total days (7 cols)
    headers += [f'كلي_{d}' for d in DAYS_OF_WEEK]
    
    # Days per month (12 months * 7 days) Grouped by day, then month
    for d in DAYS_OF_WEEK:
        for i in range(1, 13):
            headers += [f'يوم_{d}_{str(i).zfill(2)}']
            
    headers += ['اليوم الأكثر تكراراً']

    for col, h in enumerate(headers):
        ws_data.write(0, col, h, header_fmt)

    for row, e in enumerate(employees):
        r = row + 1
        ws_data.write(r, 0, e['الفرع'], cell_fmt)
        ws_data.write(r, 1, e['اسم الموظف'], cell_fmt)
        ws_data.write(r, 2, e['إجمالي الدقائق'], cell_fmt)
        ws_data.write(r, 3, e['إجمالي حالات التأخير'], cell_fmt)
        ws_data.write(r, 4, e['إجمالي الساعات'], cell_fmt)
        ws_data.write(r, 5, e['متوسط دقائق التأخير'], cell_fmt)
        ws_data.write(r, 6, e['الأشهر المسجلة'], cell_fmt)
        # col 7: نسبة_التأخير (Formula linked to settings)
        ws_data.write_formula(r, 7, f'=IF(الإعدادات!$B$2>0, D{r+1}/الإعدادات!$B$2, 0)', cell_fmt)
        # col 8: Match_Flag
        ws_data.write_formula(r, 8, f'=IF(AND(OR(لوحة_القيادة!$C$4="الكل", A{r+1}=لوحة_القيادة!$C$4), IF(لوحة_القيادة!$C$5="الكل", TRUE, INDEX($W{r+1}:$AH{r+1}, 1, VALUE(لوحة_القيادة!$C$5))>0)), 1, 0)')
        # col 9: Running_Count
        ws_data.write_formula(r, 9, f'=IF(I{r+1}=1, SUM($I$2:I{r+1}), "")')
        
        # cols 10-21: دقائق الشهور (12 months)
        for i in range(1, 13):
            ws_data.write(r, 9 + i, e['دقائق_الشهور'][str(i).zfill(2)], cell_fmt)
            
        # cols 22-33: حالات الشهور (12 months)
        for i in range(1, 13):
            ws_data.write(r, 21 + i, e['حالات_الشهور'][str(i).zfill(2)], cell_fmt)
            
        # cols 34-40: Total days per weekday (7 days) = AI:AO
        for i, d in enumerate(DAYS_OF_WEEK):
            ws_data.write(r, 34 + i, e['إجمالي_أيام'][d], cell_fmt)
            
        # cols 41-124: Days by month (7 days * 12 months = 84 cols) starting AP
        col_idx = 41
        for d in DAYS_OF_WEEK:
            for i in range(1, 13):
                ws_data.write(r, col_idx, e['أيام_الشهور'][str(i).zfill(2)][d], cell_fmt)
                col_idx += 1
        
        # col 125 (DV): اليوم الأكثر تكراراً
        ws_data.write(r, col_idx, e['اليوم الأكثر تكراراً'], cell_fmt)
                
    ws_data.hide()

    # 3. Branch Summary Sheet
    ws_summary = workbook.add_worksheet('ملخص_الفروع')
    ws_summary.right_to_left()
    ws_summary.set_tab_color('#10B981')
    
    ws_summary.merge_range('A1:J2', 'التقرير الشامل لأداء الفروع', title_format)
    
    summary_headers = ['الفرع', 'إجمالي حالات التأخير', 'إجمالي الدقائق', 'إجمالي الساعات', 'متوسط دقائق التأخير', 'إجمالي موظفي الفرع', 'المتأخرون', 'نسبة المتأخرين %', 'الموظف الأكثر تأخيراً', 'اليوم الأكثر تكراراً']
    for col, h in enumerate(summary_headers):
        ws_summary.write(3, col, h, header_fmt)
        
    branches_stats = sorted(branches_stats, key=lambda x: x['إجمالي حالات التأخير'], reverse=True)
    
    pct_fmt = workbook.add_format({'border': 1, 'align': 'center', 'valign': 'vcenter', 'num_format': '0.0"%"'})
    high_pct_fmt = workbook.add_format({'border': 1, 'align': 'center', 'valign': 'vcenter', 'num_format': '0.0"%"', 'bg_color': '#FEE2E2', 'font_color': '#DC2626', 'bold': True})
    
    for row, stat in enumerate(branches_stats):
        r = row + 4
        ws_summary.write(r, 0, stat['الفرع'], cell_fmt)
        ws_summary.write(r, 1, stat['إجمالي حالات التأخير'], cell_fmt)
        ws_summary.write(r, 2, stat['إجمالي الدقائق'], cell_fmt)
        ws_summary.write(r, 3, stat['إجمالي الساعات'], cell_fmt)
        ws_summary.write(r, 4, stat['متوسط دقائق التأخير'], cell_fmt)
        # إجمالي موظفي الفرع (ديناميكي)
        ws_summary.write_formula(r, 5, f'=IFERROR(VLOOKUP(A{r+1}, الإعدادات!$D:$E, 2, FALSE), 187)', cell_fmt)
        ws_summary.write(r, 6, stat['إجمالي الموظفين المتأخرين'], cell_fmt)
        # نسبة المتأخرين (ديناميكي)
        ws_summary.write_formula(r, 7, f'=IF(F{r+1}>0, G{r+1}/F{r+1}, 0)', pct_fmt)
        ws_summary.write(r, 8, stat['الموظف الأكثر تأخيراً'], cell_fmt)
        ws_summary.write(r, 9, stat['اليوم الأكثر تكراراً'], cell_fmt)
        
    ws_summary.conditional_format(f'H5:H{len(branches_stats)+4}', {'type': 'cell', 'criteria': '>=', 'value': 0.5, 'format': high_pct_fmt})
        
    ws_summary.set_column('A:A', 35)
    ws_summary.set_column('B:H', 22)
    ws_summary.set_column('I:I', 40)
    ws_summary.set_column('J:J', 25)

    # 4. Dashboard (Interactive)
    ws_dash = workbook.add_worksheet('لوحة_القيادة')
    ws_dash.right_to_left()
    ws_dash.set_tab_color('#2563EB')
    
    for i in range(500):
        ws_dash.set_row(i, 20, workbook.add_format({'bg_color': bg_color}))
        
    ws_dash.set_column('A:A', 5)
    ws_dash.set_column('B:J', 20)
    
    ws_dash.merge_range('B2:J3', 'لوحة القيادة التفاعلية للموظفين المتأخرين', title_format)
    
    ws_dash.write('B4', 'تصفية حسب الفرع:', dropdown_label_fmt)
    ws_dash.write('C4', 'الكل', dropdown_cell_fmt)
    ws_dash.data_validation('C4', {'validate': 'list', 'source': f'=قوائم_النطاقات!$A$1:$A${len(branches)+1}'})
    
    ws_dash.write('B5', 'تصفية حسب الشهر:', dropdown_label_fmt)
    ws_dash.write('C5', 'الكل', dropdown_cell_fmt)
    ws_dash.data_validation('C5', {'validate': 'list', 'source': f'=قوائم_النطاقات!$B$1:$B$13'})
    
    ws_dash.write('B7', 'إجمالي الموظفين المتأخرين', kpi_title_fmt)
    ws_dash.write_formula('B8', '=MAX(البيانات_الأساسية!J:J)', kpi_val_fmt)
    
    ws_dash.write('D7', 'إجمالي حالات التأخير', kpi_title_fmt)
    ws_dash.write_formula('D8', '=IF($C$5="الكل", SUMIFS(البيانات_الأساسية!D:D, البيانات_الأساسية!I:I, 1), SUMPRODUCT((البيانات_الأساسية!I$2:I$5000=1)*INDEX(البيانات_الأساسية!$W$2:$AH$5000,0,VALUE($C$5))))', kpi_val_fmt)
    
    ws_dash.write('F7', 'إجمالي الدقائق', kpi_title_fmt)
    ws_dash.write_formula('F8', '=IF($C$5="الكل", SUMIFS(البيانات_الأساسية!C:C, البيانات_الأساسية!I:I, 1), SUMPRODUCT((البيانات_الأساسية!I$2:I$5000=1)*INDEX(البيانات_الأساسية!$K$2:$V$5000,0,VALUE($C$5))))', kpi_val_fmt)
    
    ws_dash.write('H7', 'إجمالي الساعات', kpi_title_fmt)
    ws_dash.write_formula('H8', '=ROUND(F8/60, 2)', kpi_val_fmt)
    
    # Days per month (col 41+): 7 days * 12 months = 84 cols starting col 41(AQ) per day group
    # Day i month j = col 41 + i*12 + j-1
    # Ahad months: cols 41-52 (AQ:BB), Ithnain: 53-64 (BC:BN), Thalatha: 65-76 (BO:BZ),
    # Arba: 77-88 (CA:CL), Khamees: 89-100 (CM:CX), Juma: 101-112 (CY:DJ), Sabt: 113-124 (DK:DV)
    ws_dash.write('Z100', 'الأحد')
    ws_dash.write_formula('AA100', '=IF($C$5="الكل", SUMIFS(البيانات_الأساسية!AJ:AJ, البيانات_الأساسية!I:I, 1), SUMIFS(INDEX(البيانات_الأساسية!$AQ:$BB, 0, VALUE($C$5)), البيانات_الأساسية!I:I, 1))')
    ws_dash.write('Z101', 'الاثنين')
    ws_dash.write_formula('AA101', '=IF($C$5="الكل", SUMIFS(البيانات_الأساسية!AK:AK, البيانات_الأساسية!I:I, 1), SUMIFS(INDEX(البيانات_الأساسية!$BC:$BN, 0, VALUE($C$5)), البيانات_الأساسية!I:I, 1))')
    ws_dash.write('Z102', 'الثلاثاء')
    ws_dash.write_formula('AA102', '=IF($C$5="الكل", SUMIFS(البيانات_الأساسية!AL:AL, البيانات_الأساسية!I:I, 1), SUMIFS(INDEX(البيانات_الأساسية!$BO:$BZ, 0, VALUE($C$5)), البيانات_الأساسية!I:I, 1))')
    ws_dash.write('Z103', 'الأربعاء')
    ws_dash.write_formula('AA103', '=IF($C$5="الكل", SUMIFS(البيانات_الأساسية!AM:AM, البيانات_الأساسية!I:I, 1), SUMIFS(INDEX(البيانات_الأساسية!$CA:$CL, 0, VALUE($C$5)), البيانات_الأساسية!I:I, 1))')
    ws_dash.write('Z104', 'الخميس')
    ws_dash.write_formula('AA104', '=IF($C$5="الكل", SUMIFS(البيانات_الأساسية!AN:AN, البيانات_الأساسية!I:I, 1), SUMIFS(INDEX(البيانات_الأساسية!$CM:$CX, 0, VALUE($C$5)), البيانات_الأساسية!I:I, 1))')
    ws_dash.write('Z105', 'الجمعة')
    ws_dash.write_formula('AA105', '=IF($C$5="الكل", SUMIFS(البيانات_الأساسية!AO:AO, البيانات_الأساسية!I:I, 1), SUMIFS(INDEX(البيانات_الأساسية!$CY:$DJ, 0, VALUE($C$5)), البيانات_الأساسية!I:I, 1))')
    ws_dash.write('Z106', 'السبت')
    ws_dash.write_formula('AA106', '=IF($C$5="الكل", SUMIFS(البيانات_الأساسية!AP:AP, البيانات_الأساسية!I:I, 1), SUMIFS(INDEX(البيانات_الأساسية!$DK:$DV, 0, VALUE($C$5)), البيانات_الأساسية!I:I, 1))')
    
    ws_dash.write('J7', 'اليوم الأكثر تكراراً', kpi_title_fmt)
    ws_dash.write_formula('J8', '=IF(MAX(AA100:AA106)=0, "لا يوجد", INDEX(Z100:Z106, MATCH(MAX(AA100:AA106), AA100:AA106, 0)))', kpi_val_fmt)
    
    ws_dash.merge_range('B11:J11', 'جدول التفاصيل للموظفين', workbook.add_format({'bold': True, 'font_size': 14, 'bg_color': bg_color, 'align': 'right'}))
    
    dash_headers = ['الترتيب', 'الفرع', 'اسم الموظف', 'عدد التأخيرات', 'إجمالي الدقائق', 'إجمالي الساعات', 'متوسط التأخير', 'الأشهر المسجلة', 'اليوم الأكثر تكراراً', 'نسبة التأخير %']
    for col, h in enumerate(dash_headers):
        ws_dash.write(12, col+1, h, header_fmt)
    
    # Calculate the column letter for اليوم الأكثر تكراراً in البيانات_الأساسية
    # Headers: 0=الفرع,1=اسم الموظف,2=الدقائق,3=الحالات,4=الساعات,5=متوسط,6=الأشهر,7=نسبة,8=Match,9=Running
    # 10-21: دقائق شهور (12), 22-33: حالات شهور (12), 34-40: أيام كلي (7), 41-124: أيام شهور (84)
    # col 125: اليوم الأكثر تكراراً
    import string
    def col_letter(n):
        result = ''
        while n >= 0:
            result = chr(65 + n % 26) + result
            n = n // 26 - 1
        return result
    day_col = col_letter(125)  # 0-indexed col 125 -> DX
    
    for i in range(1, 451):
        r = i + 12
        row_ref = f'MATCH({i}, البيانات_الأساسية!$J:$J, 0)'
        
        ws_dash.write_formula(r, 1, f'=IF(C{r+1}="","", {i})', cell_fmt)
        ws_dash.write_formula(r, 2, f'=IFERROR(INDEX(البيانات_الأساسية!A:A, {row_ref}), "")', cell_fmt)
        ws_dash.write_formula(r, 3, f'=IFERROR(INDEX(البيانات_الأساسية!B:B, {row_ref}), "")', cell_fmt)
        # عدد التأخيرات (col D=3, 1-indexed=4)
        ws_dash.write_formula(r, 4, f'=IFERROR(IF($C$5="الكل", INDEX(البيانات_الأساسية!D:D, {row_ref}), INDEX(البيانات_الأساسية!$W:$AH, {row_ref}, VALUE($C$5))), "")', cell_fmt)
        # إجمالي الدقائق (col C=2, 1-indexed=3)
        ws_dash.write_formula(r, 5, f'=IFERROR(IF($C$5="الكل", INDEX(البيانات_الأساسية!C:C, {row_ref}), INDEX(البيانات_الأساسية!$K:$V, {row_ref}, VALUE($C$5))), "")', cell_fmt)
        ws_dash.write_formula(r, 6, f'=IFERROR(ROUND(F{r+1}/60, 2), "")', cell_fmt)
        ws_dash.write_formula(r, 7, f'=IFERROR(ROUND(F{r+1}/E{r+1}, 2), "")', cell_fmt)
        ws_dash.write_formula(r, 8, f'=IFERROR(IF($C$5="الكل", INDEX(البيانات_الأساسية!G:G, {row_ref}), $C$5), "")', cell_fmt)
        ws_dash.write_formula(r, 9, f'=IFERROR(INDEX(البيانات_الأساسية!{day_col}:{day_col}, {row_ref}), "")', cell_fmt)
        ws_dash.write_formula(r, 10, f'=IFERROR(INDEX(البيانات_الأساسية!H:H, {row_ref}), "")', cell_fmt)

    ws_dash.set_column('B:B', 8)
    ws_dash.set_column('C:C', 25)
    ws_dash.set_column('D:D', 35)
    ws_dash.set_column('E:I', 18)
    ws_dash.set_column('J:J', 25)
    ws_dash.set_column('K:K', 18)
    
    # 5. Top 5 Employees Sheet
    ws_top5 = workbook.add_worksheet('أعلى_5_موظفين')
    ws_top5.right_to_left()
    ws_top5.set_tab_color('#DC2626')
    
    ws_top5.merge_range('A1:F2', 'أعلى 5 موظفين على مستوى الجامعة (بعدد حالات التأخير)', title_format)
    
    top5_headers = ['الترتيب', 'اسم الموظف', 'الفرع / الدائرة', 'عدد حالات التأخير', 'إجمالي الدقائق', 'إجمالي الساعات', 'نسبة حضور التأخير / أيام الدوام %']
    for col, h in enumerate(top5_headers):
        ws_top5.write(3, col, h, header_fmt)
    
    top5 = sorted(employees, key=lambda x: x['إجمالي حالات التأخير'], reverse=True)[:5]
    
    top5_rank_fmt = workbook.add_format({'bold': True, 'font_size': 14, 'font_color': '#FFFFFF', 'bg_color': '#DC2626', 'border': 2, 'align': 'center', 'valign': 'vcenter'})
    top5_name_fmt = workbook.add_format({'bold': True, 'font_size': 12, 'border': 2, 'align': 'center', 'valign': 'vcenter'})
    top5_cell_fmt = workbook.add_format({'font_size': 12, 'border': 2, 'align': 'center', 'valign': 'vcenter'})
    
    top5_pct_fmt = workbook.add_format({'font_size': 12, 'border': 2, 'align': 'center', 'valign': 'vcenter', 'num_format': '0.00"%"'})
    
    for idx, emp in enumerate(top5):
        r = idx + 4
        ws_top5.set_row(r, 30)
        ws_top5.write(r, 0, idx + 1, top5_rank_fmt)
        ws_top5.write(r, 1, emp['اسم الموظف'], top5_name_fmt)
        ws_top5.write(r, 2, emp['الفرع'], top5_cell_fmt)
        ws_top5.write(r, 3, emp['إجمالي حالات التأخير'], top5_cell_fmt)
        ws_top5.write(r, 4, emp['إجمالي الدقائق'], top5_cell_fmt)
        ws_top5.write(r, 5, emp['إجمالي الساعات'], top5_cell_fmt)
        ws_top5.write_formula(r, 6, f'=IF(الإعدادات!$B$2>0, D{r+1}/الإعدادات!$B$2, 0)', top5_pct_fmt)
    
    ws_top5.set_column('A:A', 10)
    ws_top5.set_column('B:B', 35)
    ws_top5.set_column('C:C', 30)
    ws_top5.set_column('D:G', 20)

    writer.close()
    print("Super Dashboard updated successfully.")

if __name__ == "__main__":
    create_super_dashboard()
