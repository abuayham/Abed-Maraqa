import os
import glob
import re
import unicodedata
import pandas as pd
import pdfplumber

def extract_comprehensive_data():
    files = glob.glob("*.pdf")
    all_employees = []
    
    for filepath in files:
        branch_name = os.path.basename(filepath).replace('.pdf', '')
        employees_dict = {}
        current_employee_name = None
        
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    lines = text.split('\n')
                    for line in lines:
                        rev_line = unicodedata.normalize('NFKC', line[::-1])
                        
                        if "الموظف:" in rev_line and "عدد التأخيرات:" in rev_line:
                            match = re.search(r"الموظف:\s*(.*?)\s*عدد التأخيرات:", rev_line)
                            if match:
                                name = match.group(1).strip()
                                current_employee_name = name
                                if name not in employees_dict:
                                    employees_dict[name] = {
                                        'الفرع': branch_name,
                                        'اسم الموظف': name,
                                        'إجمالي حالات التأخير': 0,
                                        'إجمالي دقائق التأخير': 0,
                                        'الأشهر': set()
                                    }
                                
                                delay_match = re.search(r"عدد التأخيرات:\s*(\d+)", rev_line)
                                if delay_match:
                                    employees_dict[name]['إجمالي حالات التأخير'] = int(delay_match.group(1)[::-1])
                        
                        if "مجموع دقائق التأخير" in rev_line:
                            match = re.search(r"مجموع دقائق التأخير\s*(\d+)", rev_line)
                            if match and current_employee_name is not None:
                                employees_dict[current_employee_name]['إجمالي دقائق التأخير'] = int(match.group(1)[::-1])

                        for d in re.finditer(r'(\d{2})/(\d{2})/(\d{4})', line):
                            if current_employee_name is not None:
                                employees_dict[current_employee_name]['الأشهر'].add(d.group(2))
                        for d in re.finditer(r'(\d{4})/(\d{2})/(\d{2})', line):
                            if current_employee_name is not None:
                                employees_dict[current_employee_name]['الأشهر'].add(d.group(2))
                                
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        if row and len(row) >= 4 and row[0] and str(row[0]).isdigit():
                            date_str = str(row[3]) if len(row) > 3 else ""
                            if date_str and current_employee_name is not None:
                                m = re.search(r'(\d{2})/(\d{2})/(\d{4})', date_str)
                                if m:
                                    employees_dict[current_employee_name]['الأشهر'].add(m.group(2))

        for e in employees_dict.values():
            e['إجمالي الساعات'] = round(e['إجمالي دقائق التأخير'] / 60, 2)
            e['متوسط دقائق التأخير'] = round(e['إجمالي دقائق التأخير'] / e['إجمالي حالات التأخير'], 2) if e['إجمالي حالات التأخير'] > 0 else 0
            e['الأشهر المسجلة'] = "، ".join(sorted(list(e['الأشهر']))) if e['الأشهر'] else "غير محدد"
            all_employees.append(e)

    return all_employees

def create_advanced_dashboard():
    employees = extract_comprehensive_data()
    employees = sorted(employees, key=lambda x: x['إجمالي دقائق التأخير'], reverse=True)
    
    excel_path = os.path.abspath('لوحة_القيادة_الاحترافية_المتقدمة.xlsx')
    writer = pd.ExcelWriter(excel_path, engine='xlsxwriter')
    workbook = writer.book
    
    bg_color = '#F3F4F6'
    card_bg = '#FFFFFF'
    title_format = workbook.add_format({'bold': True, 'font_size': 24, 'font_color': '#111827', 'bg_color': bg_color, 'align': 'right', 'valign': 'vcenter'})
    
    kpi_title_fmt = workbook.add_format({'bold': True, 'font_size': 12, 'font_color': '#6B7280', 'bg_color': card_bg, 'align': 'center', 'valign': 'vcenter', 'top': 1, 'left': 1, 'right': 1, 'border_color': '#E5E7EB'})
    kpi_val_fmt = workbook.add_format({'bold': True, 'font_size': 20, 'font_color': '#1D4ED8', 'bg_color': card_bg, 'align': 'center', 'valign': 'vcenter', 'bottom': 1, 'left': 1, 'right': 1, 'border_color': '#E5E7EB'})
    
    header_fmt = workbook.add_format({'bold': True, 'font_size': 12, 'font_color': '#FFFFFF', 'bg_color': '#2563EB', 'align': 'center', 'valign': 'vcenter', 'border': 1, 'border_color': '#1D4ED8'})
    cell_fmt = workbook.add_format({'font_size': 11, 'align': 'center', 'valign': 'vcenter', 'border': 1, 'border_color': '#E5E7EB', 'bg_color': card_bg})
    
    dropdown_label_fmt = workbook.add_format({'bold': True, 'font_size': 14, 'font_color': '#111827', 'bg_color': bg_color, 'align': 'left', 'valign': 'vcenter'})
    dropdown_cell_fmt = workbook.add_format({'font_size': 14, 'bold': True, 'font_color': '#047857', 'bg_color': '#D1FAE5', 'align': 'center', 'valign': 'vcenter', 'border': 1, 'border_color': '#34D399'})

    # 1. System Lists (Hidden)
    ws_lists = workbook.add_worksheet('قوائم_النظام')
    ws_lists.right_to_left()
    branches = sorted(list(set(e['الفرع'] for e in employees)))
    ws_lists.write(0, 0, 'الكل')
    for i, b in enumerate(branches):
        ws_lists.write(i+1, 0, b)
    ws_lists.hide()

    # 2. Raw Data (Hidden)
    ws_data = workbook.add_worksheet('البيانات_الأساسية')
    ws_data.right_to_left()
    headers = ['الفرع', 'اسم الموظف', 'إجمالي الدقائق', 'إجمالي الساعات', 'عدد التأخيرات', 'متوسط التأخير', 'الأشهر المسجلة', 'Match_Flag', 'Running_Count']
    for col, h in enumerate(headers):
        ws_data.write(0, col, h, header_fmt)

    for row, e in enumerate(employees):
        r = row + 1
        ws_data.write(r, 0, e['الفرع'], cell_fmt)
        ws_data.write(r, 1, e['اسم الموظف'], cell_fmt)
        ws_data.write(r, 2, e['إجمالي دقائق التأخير'], cell_fmt)
        ws_data.write(r, 3, e['إجمالي الساعات'], cell_fmt)
        ws_data.write(r, 4, e['إجمالي حالات التأخير'], cell_fmt)
        ws_data.write(r, 5, e['متوسط دقائق التأخير'], cell_fmt)
        ws_data.write(r, 6, e['الأشهر المسجلة'], cell_fmt)
        
        ws_data.write_formula(r, 7, f'=IF(OR(لوحة_القيادة!$C$4="الكل", A{r+1}=لوحة_القيادة!$C$4), 1, 0)')
        ws_data.write_formula(r, 8, f'=IF(H{r+1}=1, SUM($H$2:H{r+1}), "")')
        
    ws_data.hide()

    # 3. Dashboard (Interactive)
    ws_dash = workbook.add_worksheet('لوحة_القيادة')
    ws_dash.right_to_left()
    ws_dash.set_tab_color('#2563EB')
    
    for i in range(500):
        ws_dash.set_row(i, 20, workbook.add_format({'bg_color': bg_color}))
        
    ws_dash.set_column('A:A', 5)
    ws_dash.set_column('B:H', 20)
    
    ws_dash.merge_range('B2:H3', 'المنصة الإدارية الذكية لتحليل الالتزام (بدون Pivot)', title_format)
    
    ws_dash.write('B4', 'اختر الفرع للتحليل:', dropdown_label_fmt)
    ws_dash.write('C4', 'الكل', dropdown_cell_fmt)
    ws_dash.data_validation('C4', {'validate': 'list', 'source': f'=قوائم_النظام!$A$1:$A${len(branches)+1}'})
    
    # KPIs
    ws_dash.write('B6', 'إجمالي الموظفين', kpi_title_fmt)
    ws_dash.write_formula('B7', '=IF($C$4="الكل", COUNTA(البيانات_الأساسية!B:B)-1, COUNTIF(البيانات_الأساسية!A:A, $C$4))', kpi_val_fmt)
    
    ws_dash.write('D6', 'إجمالي التأخيرات', kpi_title_fmt)
    ws_dash.write_formula('D7', '=IF($C$4="الكل", SUM(البيانات_الأساسية!E:E), SUMIF(البيانات_الأساسية!A:A, $C$4, البيانات_الأساسية!E:E))', kpi_val_fmt)
    
    ws_dash.write('F6', 'إجمالي الدقائق', kpi_title_fmt)
    ws_dash.write_formula('F7', '=IF($C$4="الكل", SUM(البيانات_الأساسية!C:C), SUMIF(البيانات_الأساسية!A:A, $C$4, البيانات_الأساسية!C:C))', kpi_val_fmt)
    
    ws_dash.write('H6', 'إجمالي الساعات', kpi_title_fmt)
    ws_dash.write_formula('H7', '=IF($C$4="الكل", SUM(البيانات_الأساسية!D:D), SUMIF(البيانات_الأساسية!A:A, $C$4, البيانات_الأساسية!D:D))', kpi_val_fmt)
    
    ws_dash.merge_range('B10:H10', 'الجدول التفاعلي للموظفين (يتغير فوراً باختيار الفرع من الأعلى)', workbook.add_format({'bold': True, 'font_size': 14, 'bg_color': bg_color, 'align': 'right'}))
    
    for col, h in enumerate(headers[:7]):
        ws_dash.write(11, col+1, h, header_fmt)
        
    for i in range(1, 451): # Max employees to display is 450
        r = i + 11
        ws_dash.write_formula(r, 1, f'=IFERROR(INDEX(البيانات_الأساسية!A:A, MATCH({i}, البيانات_الأساسية!$I:$I, 0)), "")', cell_fmt)
        ws_dash.write_formula(r, 2, f'=IFERROR(INDEX(البيانات_الأساسية!B:B, MATCH({i}, البيانات_الأساسية!$I:$I, 0)), "")', cell_fmt)
        ws_dash.write_formula(r, 3, f'=IFERROR(INDEX(البيانات_الأساسية!C:C, MATCH({i}, البيانات_الأساسية!$I:$I, 0)), "")', cell_fmt)
        ws_dash.write_formula(r, 4, f'=IFERROR(INDEX(البيانات_الأساسية!D:D, MATCH({i}, البيانات_الأساسية!$I:$I, 0)), "")', cell_fmt)
        ws_dash.write_formula(r, 5, f'=IFERROR(INDEX(البيانات_الأساسية!E:E, MATCH({i}, البيانات_الأساسية!$I:$I, 0)), "")', cell_fmt)
        ws_dash.write_formula(r, 6, f'=IFERROR(INDEX(البيانات_الأساسية!F:F, MATCH({i}, البيانات_الأساسية!$I:$I, 0)), "")', cell_fmt)
        ws_dash.write_formula(r, 7, f'=IFERROR(INDEX(البيانات_الأساسية!G:G, MATCH({i}, البيانات_الأساسية!$I:$I, 0)), "")', cell_fmt)

    ws_dash.set_column('B:B', 25)
    ws_dash.set_column('C:C', 35)
    ws_dash.set_column('D:G', 18)
    ws_dash.set_column('H:H', 25)

    writer.close()
    print("Advanced Dashboard created successfully.")

if __name__ == "__main__":
    create_advanced_dashboard()
