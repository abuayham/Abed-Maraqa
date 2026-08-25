import os
import pdfplumber
import glob
import re
import unicodedata
from collections import Counter

def get_stats():
    total_unique_employees = set()
    total_delays = 0
    total_minutes = 0
    emp_minutes = {} 
    days_counter = Counter()

    files = glob.glob("*.pdf")
    
    for filepath in files:
        branch_name = os.path.basename(filepath).replace('.pdf', '')
        with pdfplumber.open(filepath) as pdf:
            current_employee_name = None
            
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
                                # include branch to differentiate same names in diff branches
                                current_employee_name = f"{name} ({branch_name})"
                                total_unique_employees.add(current_employee_name)
                                if current_employee_name not in emp_minutes:
                                    emp_minutes[current_employee_name] = 0
                        
                        if "مجموع دقائق التأخير" in rev_line:
                            match = re.search(r"مجموع دقائق التأخير\s*(\d+)", rev_line)
                            if match and current_employee_name is not None:
                                num_str = match.group(1)[::-1]
                                emp_minutes[current_employee_name] = int(num_str)
                                
                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        if row and len(row) >= 4 and row[0] and str(row[0]).isdigit():
                            total_delays += 1
                            day_str = row[1]
                            if day_str:
                                day_clean = unicodedata.normalize('NFKC', day_str[::-1]).strip()
                                days_counter[day_clean] += 1

    total_minutes = sum(emp_minutes.values())
    avg_mins = total_minutes / total_delays if total_delays > 0 else 0
    
    top_emp = max(emp_minutes.items(), key=lambda x: x[1]) if emp_minutes else ("None", 0)
    top_day = days_counter.most_common(1)[0] if days_counter else ("None", 0)

    with open('stats_output.txt', 'w', encoding='utf-8') as f:
        f.write(f"إجمالي عدد الموظفين: {len(total_unique_employees)}\n")
        f.write(f"إجمالي عدد التأخيرات: {total_delays}\n")
        f.write(f"إجمالي دقائق التأخير: {total_minutes}\n")
        f.write(f"متوسط دقائق التأخير لكل تأخير: {avg_mins:.2f}\n")
        f.write(f"الموظف الأكثر تأخيرًا: {top_emp[0]} ({top_emp[1]} دقيقة)\n")
        f.write(f"اليوم الأكثر تكرارًا للتأخيرات: {top_day[0]} ({top_day[1]} مرة)\n")
        f.write(f"\nAll days: {dict(days_counter)}\n")

if __name__ == "__main__":
    get_stats()
