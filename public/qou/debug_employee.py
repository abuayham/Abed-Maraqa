import glob
import pdfplumber
import unicodedata
import re

target_name = "جهاد احمد"

print(f"Searching for '{target_name}'...")
for filepath in glob.glob("*.pdf"):
    with pdfplumber.open(filepath) as pdf:
        current_emp = None
        found_emp = False
        
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                for line in text.split('\n'):
                    rev_line = unicodedata.normalize('NFKC', line[::-1])
                    if "الموظف:" in rev_line and "عدد التأخيرات:" in rev_line:
                        match = re.search(r"الموظف:\s*(.*?)\s*عدد التأخيرات:", rev_line)
                        if match:
                            name = match.group(1).strip()
                            current_emp = name
                            if target_name in name:
                                found_emp = True
                                print(f"\n[!] Found employee '{name}' in {filepath} on page {i+1}")
            
            if found_emp and current_emp and target_name in current_emp:
                tables = page.extract_tables()
                print(f"  -> Extracted {len(tables)} tables on this page.")
                for t_idx, table in enumerate(tables):
                    print(f"  -> Table {t_idx+1}: {len(table)} rows")
                    for row in table[:3]:
                        print(f"       Row: {row}")
