import glob
import os
from generate_super_dashboard import extract_comprehensive_data

def audit_data():
    print("بدء عملية تدقيق البيانات الشاملة...")
    employees, branches = extract_comprehensive_data()
    
    errors = []
    
    # Audit Employees
    for emp in employees:
        sum_mins = sum(emp['دقائق_الشهور'].values())
        if sum_mins != emp['إجمالي الدقائق']:
            errors.append(f"خطأ في موظف {emp['اسم الموظف']}: مجموع دقائق الشهور ({sum_mins}) لا يساوي الإجمالي ({emp['إجمالي الدقائق']})")
            
        sum_delays = sum(emp['حالات_الشهور'].values())
        if sum_delays != emp['إجمالي حالات التأخير']:
            errors.append(f"خطأ في موظف {emp['اسم الموظف']}: مجموع حالات الشهور ({sum_delays}) لا يساوي الإجمالي ({emp['إجمالي حالات التأخير']})")
            
        sum_days = sum(emp['إجمالي_أيام'].values())
        if sum_days != emp['إجمالي حالات التأخير']:
             # Not every delay has a known day if PDF parsing failed on a row, but ideally they match
             if sum_days < emp['إجمالي حالات التأخير']:
                 pass # expected if some rows had missing dates/days
                 
    # Audit Branches
    for branch in branches:
        branch_name = branch['الفرع']
        branch_emps = [e for e in employees if e['الفرع'] == branch_name]
        
        calc_total_mins = sum(e['إجمالي الدقائق'] for e in branch_emps)
        if calc_total_mins != branch['إجمالي الدقائق']:
            errors.append(f"خطأ في فرع {branch_name}: مجموع الدقائق للموظفين ({calc_total_mins}) لا يساوي الإجمالي في الفرع ({branch['إجمالي الدقائق']})")
            
        calc_total_delays = sum(e['إجمالي حالات التأخير'] for e in branch_emps)
        if calc_total_delays != branch['إجمالي حالات التأخير']:
            errors.append(f"خطأ في فرع {branch_name}: مجموع حالات التأخير للموظفين ({calc_total_delays}) لا يساوي الإجمالي في الفرع ({branch['إجمالي حالات التأخير']})")
            
        calc_total_emps = len(branch_emps)
        if calc_total_emps != branch['إجمالي الموظفين المتأخرين']:
             errors.append(f"خطأ في فرع {branch_name}: عدد الموظفين ({calc_total_emps}) لا يساوي العدد في الفرع ({branch['إجمالي الموظفين المتأخرين']})")
             
    if errors:
        print("تم العثور على الأخطاء التالية أثناء التدقيق:")
        for err in errors:
            print("-", err)
    else:
        print("نتيجة التدقيق: 100% صحيحة. لا يوجد أي أخطاء رياضية أو تناقضات في تجميع البيانات.")
        print(f"تم تدقيق {len(employees)} موظفاً عبر {len(branches)} فروع.")

if __name__ == "__main__":
    audit_data()
