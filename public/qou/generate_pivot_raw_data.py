import os
import glob
import re
import unicodedata
import pandas as pd
import pdfplumber

def extract_all_delays():
    files = glob.glob("*.pdf")
    all_delays = []
    
    for filepath in files:
        branch_name = os.path.basename(filepath).replace('.pdf', '')
        current_employee_name = "غير محدد"
        
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
                                current_employee_name = match.group(1).strip()
                
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        if row and len(row) >= 4 and row[0] and str(row[0]).isdigit():
                            minutes = int(row[0])
                            day_name = unicodedata.normalize('NFKC', str(row[1])[::-1]).strip() if row[1] else ""
                            time_delay = str(row[2]) if row[2] else ""
                            date_str = str(row[3]) if len(row) > 3 and row[3] else ""
                            
                            month = "غير محدد"
                            m = re.search(r'\d{2}/(\d{2})/\d{4}', date_str)
                            if m:
                                month = m.group(1)
                                
                            all_delays.append({
                                'الفرع': branch_name,
                                'اسم الموظف': current_employee_name,
                                'الشهر': month,
                                'التاريخ': date_str,
                                'اليوم': day_name,
                                'وقت التأخير': time_delay,
                                'دقائق التأخير': minutes
                            })
                            
    return all_delays

def main():
    delays = extract_all_delays()
    df = pd.DataFrame(delays)
    
    excel_path = os.path.abspath('تحليل_التأخيرات_Pivot.xlsx')
    
    writer = pd.ExcelWriter(excel_path, engine='xlsxwriter')
    df.to_excel(writer, sheet_name='البيانات_الخام', index=False)
    
    # Format the raw data as a table for better appearance
    workbook = writer.book
    worksheet = writer.sheets['البيانات_الخام']
    worksheet.right_to_left()
    
    last_row = len(df)
    last_col = len(df.columns) - 1
    
    # Map column number to Excel letter
    def col_num_to_letter(n):
        string = ""
        while n > 0:
            n, remainder = divmod(n - 1, 26)
            string = chr(65 + remainder) + string
        return string
        
    last_col_letter = col_num_to_letter(last_col + 1)
    
    worksheet.add_table(f'A1:{last_col_letter}{last_row+1}', {'columns': [{'header': c} for c in df.columns]})
    
    worksheet.set_column('A:B', 30)
    worksheet.set_column('C:G', 15)
    
    writer.close()
    print("Raw data Excel created.")
    
    # Try to add Pivot Table via win32com
    try:
        import win32com.client as win32
        excel = win32.gencache.EnsureDispatch('Excel.Application')
        excel.Visible = False
        excel.DisplayAlerts = False
        
        wb = excel.Workbooks.Open(excel_path)
        ws_data = wb.Sheets('البيانات_الخام')
        ws_pivot = wb.Sheets.Add()
        ws_pivot.Name = 'لوحة_Pivot_التفاعلية'
        
        pc = wb.PivotCaches().Create(SourceType=1, SourceData=f"البيانات_الخام!R1C1:R{last_row+1}C7")
        pt = pc.CreatePivotTable(TableDestination=f"{ws_pivot.Name}!R3C1", TableName="PivotTable1")
        
        pt.PivotFields("الشهر").Orientation = 3 # xlPageField
        
        pt.PivotFields("الفرع").Orientation = 1 # xlRowField
        pt.PivotFields("الفرع").Position = 1
        
        pt.PivotFields("اسم الموظف").Orientation = 1 # xlRowField
        pt.PivotFields("اسم الموظف").Position = 2
        
        data_field = pt.PivotFields("دقائق التأخير")
        data_field.Orientation = 4 # xlDataField
        data_field.Function = -4157 # xlSum
        data_field.Name = "إجمالي دقائق التأخير"
        
        ws_pivot.DisplayRightToLeft = True
        
        # Add a slicer for the month? Not strictly necessary if it's a page field, but nice.
        # Too complex to script right now.
        
        wb.Save()
        wb.Close()
        excel.Quit()
        print("Pivot table created successfully inside the Excel file.")
    except Exception as e:
        print(f"Pivot table creation failed: {e}")
        try:
            excel.Quit()
        except:
            pass

if __name__ == "__main__":
    main()
