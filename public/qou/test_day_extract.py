import pdfplumber
import unicodedata

with pdfplumber.open('فرع نابلس.pdf') as pdf:
    for page in pdf.pages[:1]:
        tables = page.extract_tables()
        for table in tables:
            for row in table:
                if row and len(row) >= 4 and row[0] and str(row[0]).isdigit():
                    day_str = unicodedata.normalize('NFKC', str(row[1])[::-1]).strip() if len(row) > 1 and row[1] else ""
                    print(repr(day_str))
