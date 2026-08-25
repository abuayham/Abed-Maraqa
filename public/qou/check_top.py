from generate_super_dashboard import extract_comprehensive_data
import json

employees, branches = extract_comprehensive_data()
branches = sorted(branches, key=lambda x: x['إجمالي حالات التأخير'], reverse=True)
top = [b['الفرع'] for b in branches[:5]]
with open("top_branches.txt", "w", encoding="utf-8") as f:
    f.write(json.dumps(top, ensure_ascii=False))
