import json
import pandas as pd

# Read the JSON data
with open('results2.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Convert to list of dictionaries
rows = []
for branch, metrics in data.items():
    rows.append({
        'الفرع / الدائرة': branch,
        'إجمالي الدقائق': metrics['total_minutes'],
        'عدد حالات التأخير': metrics['total_delays']
    })

# Create DataFrame
df = pd.DataFrame(rows)

# Sort by total minutes
df = df.sort_values('إجمالي الدقائق')

# Reorder columns
df = df[['الفرع / الدائرة', 'عدد حالات التأخير', 'إجمالي الدقائق']]

# Add a rank column
df.insert(0, 'الترتيب', range(1, len(df) + 1))

# Write to Excel
df.to_excel('تقرير_التأخيرات_النهائي.xlsx', index=False)

print("Excel generated successfully.")
