import os
import pdfplumber
import glob
import re
import pandas as pd
import unicodedata

WORKING_DAYS = 135

def parse_pdf_detailed(filepath):
    employees_dict = {}
    current_employee_name = None
    
    with pdfplumber.open(filepath) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue
                
            lines = text.split('\n')
            for line in lines:
                rev_line = unicodedata.normalize('NFKC', line[::-1])
                
                # Check for employee name header
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
                        
                        # Extract the number of delays
                        delay_match = re.search(r"عدد التأخيرات:\s*(\d+)", rev_line)
                        if delay_match:
                            num_str = delay_match.group(1)[::-1]
                            # We can just set it, if it repeats it's the same number
                            employees_dict[name]['عدد حالات التأخير'] = int(num_str)
                
                # Check for total minutes
                if "مجموع دقائق التأخير" in rev_line:
                    match = re.search(r"مجموع دقائق التأخير\s*(\d+)", rev_line)
                    if match and current_employee_name is not None:
                        num_str = match.group(1)[::-1]
                        # Set the total minutes. If it appears multiple times, 
                        # setting it will just overwrite with the same grand total or the latest subtotal.
                        # Usually it's the grand total at the end.
                        employees_dict[current_employee_name]['إجمالي دقائق التأخير'] = int(num_str)

    branch = os.path.basename(filepath).replace('.pdf', '')
    return branch, list(employees_dict.values())

if __name__ == "__main__":
    files = glob.glob("*.pdf")
    
    writer = pd.ExcelWriter('تقرير_الموظفين_المفصل_محدث.xlsx', engine='openpyxl')
    
    summary_data = []
    
    for f in files:
        branch, employees_data = parse_pdf_detailed(f)
        
        if not employees_data:
            continue
            
        df = pd.DataFrame(employees_data)
        
        # calculate average
        df['متوسط دقائق التأخير للحالة'] = (df['إجمالي دقائق التأخير'] / df['عدد حالات التأخير']).round(2)
        df['متوسط دقائق التأخير للحالة'] = df['متوسط دقائق التأخير للحالة'].fillna(0)
        df['نسبة التأخير %'] = (df['عدد حالات التأخير'] / WORKING_DAYS * 100).round(2)
        
        df = df.sort_values('عدد حالات التأخير', ascending=False)
        
        df.insert(0, 'الترتيب', range(1, len(df) + 1))
        
        sheet_name = branch[:31] 
        df.to_excel(writer, sheet_name=sheet_name, index=False)
        
        summary_data.append({
            'الفرع / الدائرة': branch,
            'إجمالي الدقائق': df['إجمالي دقائق التأخير'].sum(),
            'عدد حالات التأخير': df['عدد حالات التأخير'].sum(),
            'عدد الموظفين المتأخرين': len(df)
        })
        
    summary_df = pd.DataFrame(summary_data)
    summary_df = summary_df.sort_values('عدد حالات التأخير', ascending=False)
    summary_df.insert(0, 'الترتيب', range(1, len(summary_df) + 1))
    summary_df.to_excel(writer, sheet_name='ملخص الفروع', index=False)
    
    workbook = writer.book
    summary_sheet = workbook['ملخص الفروع']
    workbook._sheets.remove(summary_sheet)
    workbook._sheets.insert(0, summary_sheet)
    
    writer.close()
