import os
import pdfplumber
import glob
import json

def parse_pdf(filepath):
    total_delays = 0
    total_minutes = 0
    
    with pdfplumber.open(filepath) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    # check if the row has at least 1 element and the first element is a number
                    if row and row[0] and str(row[0]).isdigit():
                        # We also want to make sure it's a delay row. Usually it has 4 columns:
                        # Minutes, Day, Time, Date. So len(row) should be around 4.
                        if len(row) >= 4:
                            total_minutes += int(row[0])
                            total_delays += 1

    branch = os.path.basename(filepath).replace('.pdf', '')
    return branch, total_delays, total_minutes

if __name__ == "__main__":
    files = glob.glob("*.pdf")
    results = {}
    for f in files:
        branch, total_delays, total_minutes = parse_pdf(f)
        results[branch] = {'total_delays': total_delays, 'total_minutes': total_minutes}
        print(f"Processed file with {total_delays} delays and {total_minutes} mins")
        
    with open('results2.json', 'w', encoding='utf-8') as outfile:
        json.dump(results, outfile, ensure_ascii=False, indent=2)
