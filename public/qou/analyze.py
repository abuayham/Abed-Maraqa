import os
import pdfplumber
import glob
import re
import json

def parse_pdf(filepath):
    total_delays = 0
    total_minutes = 0
    
    with pdfplumber.open(filepath) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue
                
            # Replace newlines to make it easier
            text = text.replace('\n', ' ')
            
            # Find all numbers following "عدد التأخيرات:"
            counts = re.findall(r"عدد التأخيرات:\s*(\d+)", text)
            total_delays += sum(int(c) for c in counts)
            
            # Find all numbers preceding or following "مجموع دقائق التأخير"
            # It's better to just extract the actual numbers from the tables, but let's try regex first
            # The text might be like: "مجموع دقائق التأخير 27"
            mins1 = re.findall(r"مجموع دقائق التأخير\s*(\d+)", text)
            total_minutes += sum(int(m) for m in mins1)
            
            mins2 = re.findall(r"(\d+)\s*مجموع دقائق التأخير", text)
            total_minutes += sum(int(m) for m in mins2)
            
            # Because sometimes the text extraction is weird, let's also try to extract tables
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    # check if the row contains "مجموع دقائق التأخير"
                    row_text = " ".join([str(c) for c in row if c])
                    if "مجموع دقائق التأخير" in row_text:
                        # find the number in the row
                        nums = re.findall(r'\b\d+\b', row_text)
                        if nums:
                            # We don't want to double count if the regex above caught it, 
                            # so let's just use table extraction for minutes if we find it
                            pass

    branch = os.path.basename(filepath).replace('.pdf', '')
    return branch, total_delays, total_minutes

if __name__ == "__main__":
    files = glob.glob("*.pdf")
    results = {}
    for f in files:
        branch, total_delays, total_minutes = parse_pdf(f)
        results[branch] = {'total_delays': total_delays, 'total_minutes': total_minutes}
        print(f"Processed {f}: Delays={total_delays}, Mins={total_minutes}".encode('utf-8'))
        
    with open('results.json', 'w', encoding='utf-8') as outfile:
        json.dump(results, outfile, ensure_ascii=False, indent=2)
