import os
import pdfplumber
import glob
import re
import unicodedata
from collections import Counter
import pandas as pd

def parse_pdf_comprehensive(filepath):
    branch_name = os.path.basename(filepath).replace('.pdf', '')
    employees_dict = {}
    current_employee_name = None
    days_counter = Counter()
    total_delays = 0
    total_minutes = 0

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
                                    'اسم الموظف': name,
                                    'عدد حالات التأخير': 0,
                                    'إجمالي دقائق التأخير': 0
                                }
                            
                            delay_match = re.search(r"عدد التأخيرات:\s*(\d+)", rev_line)
                            if delay_match:
                                num_str = delay_match.group(1)[::-1]
                                employees_dict[name]['عدد حالات التأخير'] = int(num_str)
                    
                    if "مجموع دقائق التأخير" in rev_line:
                        match = re.search(r"مجموع دقائق التأخير\s*(\d+)", rev_line)
                        if match and current_employee_name is not None:
                            num_str = match.group(1)[::-1]
                            employees_dict[current_employee_name]['إجمالي دقائق التأخير'] = int(num_str)
                            
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    if row and len(row) >= 4 and row[0] and str(row[0]).isdigit():
                        total_delays += 1
                        day_str = row[1]
                        if day_str:
                            day_clean = unicodedata.normalize('NFKC', day_str[::-1]).strip()
                            days_counter[day_clean] += 1

    # In case there's an issue with table extracting delays
    calc_total_delays = sum(e['عدد حالات التأخير'] for e in employees_dict.values())
    calc_total_minutes = sum(e['إجمالي دقائق التأخير'] for e in employees_dict.values())

    top_emp = max(employees_dict.values(), key=lambda x: x['إجمالي دقائق التأخير']) if employees_dict else None
    top_day = days_counter.most_common(1)[0] if days_counter else ("لا يوجد", 0)

    stats = {
        'الفرع': branch_name,
        'إجمالي الموظفين المتأخرين': len(employees_dict),
        'إجمالي حالات التأخير': calc_total_delays,
        'إجمالي الدقائق': calc_total_minutes,
        'متوسط دقائق التأخير': round(calc_total_minutes / calc_total_delays if calc_total_delays > 0 else 0, 2),
        'الموظف الأكثر تأخيراً': f"{top_emp['اسم الموظف']} ({top_emp['إجمالي دقائق التأخير']} دقيقة)" if top_emp else "لا يوجد",
        'اليوم الأكثر تكراراً': f"{top_day[0]} ({top_day[1]} مرة)"
    }
    
    return branch_name, stats, list(employees_dict.values())

def create_professional_dashboard():
    files = glob.glob("*.pdf")
    all_branches_stats = []
    all_employees_data = {}
    
    overall_total_employees = 0
    overall_total_delays = 0
    overall_total_minutes = 0
    overall_days_counter = Counter()
    overall_emp_minutes = {}

    for f in files:
        branch, stats, employees = parse_pdf_comprehensive(f)
        all_branches_stats.append(stats)
        all_employees_data[branch] = employees
        
        overall_total_employees += stats['إجمالي الموظفين المتأخرين']
        overall_total_delays += stats['إجمالي حالات التأخير']
        overall_total_minutes += stats['إجمالي الدقائق']
        
        for e in employees:
            overall_emp_minutes[f"{e['اسم الموظف']} ({branch})"] = e['إجمالي دقائق التأخير']
            
        # extract days again to combine? Just simple logic.
        with pdfplumber.open(f) as pdf:
            for page in pdf.pages:
                for table in page.extract_tables():
                    for row in table:
                        if row and len(row)>=4 and row[0] and str(row[0]).isdigit() and row[1]:
                            day_clean = unicodedata.normalize('NFKC', row[1][::-1]).strip()
                            overall_days_counter[day_clean] += 1

    overall_top_emp = max(overall_emp_minutes.items(), key=lambda x: x[1]) if overall_emp_minutes else ("لا يوجد", 0)
    overall_top_day = overall_days_counter.most_common(1)[0] if overall_days_counter else ("لا يوجد", 0)
    overall_avg = round(overall_total_minutes / overall_total_delays if overall_total_delays > 0 else 0, 2)

    # Use pandas with xlsxwriter
    writer = pd.ExcelWriter('الإحصائيات_الرئيسية_والتفاعلية.xlsx', engine='xlsxwriter')
    workbook = writer.book

    # Formats
    title_format = workbook.add_format({'bold': True, 'font_size': 20, 'font_color': '#FFFFFF', 'bg_color': '#1F4E78', 'align': 'center', 'valign': 'vcenter', 'border': 1})
    header_format = workbook.add_format({'bold': True, 'font_color': '#FFFFFF', 'bg_color': '#2F75B5', 'align': 'center', 'valign': 'vcenter', 'border': 1})
    cell_format = workbook.add_format({'align': 'center', 'valign': 'vcenter', 'border': 1})
    stat_box_title = workbook.add_format({'bold': True, 'font_size': 14, 'font_color': '#FFFFFF', 'bg_color': '#C00000', 'align': 'center', 'valign': 'vcenter', 'border': 1})
    stat_box_value = workbook.add_format({'bold': True, 'font_size': 16, 'bg_color': '#F2F2F2', 'align': 'center', 'valign': 'vcenter', 'border': 1})

    # ================= 1. MAIN DASHBOARD =================
    worksheet = workbook.add_worksheet('الواجهة الرئيسية (الملخص)')
    worksheet.right_to_left()
    
    # Title
    worksheet.merge_range('B2:H3', 'لوحة القيادة الرئيسية - إحصائيات التأخيرات الصباحية', title_format)

    # Overall Stats
    worksheet.write('B5', 'إجمالي الموظفين المتأخرين', stat_box_title)
    worksheet.write('B6', overall_total_employees, stat_box_value)
    
    worksheet.write('C5', 'إجمالي عدد التأخيرات', stat_box_title)
    worksheet.write('C6', overall_total_delays, stat_box_value)
    
    worksheet.write('D5', 'إجمالي دقائق التأخير', stat_box_title)
    worksheet.write('D6', f"{overall_total_minutes:,}", stat_box_value)
    
    worksheet.write('E5', 'متوسط التأخير (دقيقة)', stat_box_title)
    worksheet.write('E6', overall_avg, stat_box_value)
    
    worksheet.merge_range('F5:G5', 'الموظف الأكثر تأخيراً', stat_box_title)
    worksheet.merge_range('F6:G6', f"{overall_top_emp[0]} ({overall_top_emp[1]:,} دقيقة)", stat_box_value)
    
    worksheet.write('H5', 'اليوم الأكثر تكراراً', stat_box_title)
    worksheet.write('H6', f"{overall_top_day[0]} ({overall_top_day[1]} مرة)", stat_box_value)

    # All Branches Table
    worksheet.merge_range('B9:H9', 'إحصائيات تفصيلية لكل فرع / دائرة', title_format)
    
    df_branches = pd.DataFrame(all_branches_stats)
    df_branches = df_branches.sort_values('إجمالي الدقائق', ascending=False)
    df_branches.insert(0, 'الترتيب', range(1, len(df_branches) + 1))
    
    columns = df_branches.columns.tolist()
    for col_num, col_name in enumerate(columns):
        worksheet.write(10, col_num + 1, col_name, header_format)
        
    for row_num, row_data in enumerate(df_branches.values):
        for col_num, cell_data in enumerate(row_data):
            worksheet.write(row_num + 11, col_num + 1, cell_data, cell_format)

    worksheet.set_column('B:B', 10)
    worksheet.set_column('C:C', 35)
    worksheet.set_column('D:I', 20)
    worksheet.set_column('H:H', 40)

    # ================= 2. SHEETS FOR EACH BRANCH =================
    for branch, employees in all_employees_data.items():
        if not employees:
            continue
            
        sheet_name = branch[:31]
        ws = workbook.add_worksheet(sheet_name)
        ws.right_to_left()
        
        ws.merge_range('A1:E2', f'الإحصائيات التفصيلية للموظفين - {branch}', title_format)
        
        df = pd.DataFrame(employees)
        df['متوسط دقائق التأخير للحالة'] = (df['إجمالي دقائق التأخير'] / df['عدد حالات التأخير']).round(2)
        df['متوسط دقائق التأخير للحالة'] = df['متوسط دقائق التأخير للحالة'].fillna(0)
        df = df.sort_values('إجمالي دقائق التأخير', ascending=False)
        df.insert(0, 'الترتيب', range(1, len(df) + 1))
        
        cols = df.columns.tolist()
        for col_num, col_name in enumerate(cols):
            ws.write(3, col_num, col_name, header_format)
            
        for row_num, row_data in enumerate(df.values):
            for col_num, cell_data in enumerate(row_data):
                ws.write(row_num + 4, col_num, cell_data, cell_format)
                
        ws.set_column('A:A', 10)
        ws.set_column('B:B', 35)
        ws.set_column('C:E', 25)

    writer.close()
    print("Professional Dashboard created successfully.")

if __name__ == "__main__":
    create_professional_dashboard()
