import os
import glob
import pandas as pd
from generate_final_reports import parse_pdf_comprehensive

# Employee counts from user image
total_employees_map = {
    "الإدارة العامة - القدس": 25,
    "الإدارة العامة - البيرة": 178,
    "عمادة الدراسات العليا والبحث العلمي": 20,
    "فرع القدس": 24,
    "فرع نابلس": 90,
    "فرع قلقيلية": 46,
    "فرع سلفيت": 44,
    "فرع طوباس": 34,
    "فرع رام الله والبيرة": 82,
    "فرع أريحا": 20,
    "فرع أريحا": 20,
    "فرع اريحا": 20,
    "فرع بيت لحم": 51,
    "فرع الخليل": 60,
    "فرع دورا": 26,
    "فرع يطا": 24,
    "فرع جنين": 96,
    "فرع طولكرم": 70,
    "مركز التعليم المستمر وخدمة المجتمع": 7,
    "شؤون الطلبة": 8,
    "مركز تكنولوجيا المعلومات": 20,
    "مكاتب الادارة- الإرسال": 12,
    "ادارة الشؤون الاكاديمية - البيرة": 2,
    "مجلس الامناء": 1,
    "عمادة القبول والتسجيل والامتحانات": 23,
    "كلية العلوم التربوية": 1,
    "كلية العلوم الادارية والاقتصادية": 1,
    "كلية التنمية الاجتماعية والاسرية": 1,
    "كلية التكنولوجيا والعلوم التطبيقية": 1,
    "كلية الآداب": 1,
    "كلية الإعلام": 2,
    "وحدة الهندسة والانشاءات": 1,
    "كلية الزراعة": 6,
    "دائرة التخطيط والجودة": 6,
    "العلاقات العامة": 8,
    "البرنامج الدولي": 6,
    "مركز التعليم الرقمي": 10,
    "دائرة التدقيق الداخلي": 2,
    "وحدة الشراكات وتنمية الموارد": 5,
}

# Function to normalize names for mapping
def normalize_name(name):
    name = name.replace("يــطـــا", "يطا").replace("فـــرع", "فرع").replace("  ", " ").strip()
    name = name.replace("البيره", "البيرة").replace("والجوده", "والجودة").replace("عماده", "عمادة")
    name = name.replace("الإمتحانات", "الامتحانات")
    name = name.replace("_compressed", "").replace(" (1)", "").replace("مركز تكنولوجيا المعلومات ", "مركز تكنولوجيا المعلومات")
    return name

def main():
    WORKING_DAYS = 125
    pdf_files = glob.glob("*.pdf")
    results = []

    for pdf_file in pdf_files:
        branch_raw_name = os.path.basename(pdf_file).replace(".pdf", "")
        norm_name = normalize_name(branch_raw_name)
        
        # Try to find a matching total employee count
        total_emp = 0
        matched_key = None
        for key, val in total_employees_map.items():
            if normalize_name(key) == norm_name or norm_name in normalize_name(key):
                total_emp = val
                matched_key = key
                break
        
        # Parse PDF to get lateness stats
        try:
            _, stats, _ = parse_pdf_comprehensive(pdf_file)
            late_employees = stats.get('إجمالي الموظفين المتأخرين', 0)
            total_delays = stats.get('إجمالي حالات التأخير', 0)
            
            # Calculations
            if total_emp > 0:
                lateness_percentage = (total_delays / (total_emp * WORKING_DAYS)) * 100
                late_emp_percentage = (late_employees / total_emp) * 100
            else:
                lateness_percentage = 0
                late_emp_percentage = 0
                
            results.append({
                "الفرع / الدائرة": branch_raw_name,
                "إجمالي الموظفين": total_emp,
                "عدد الموظفين المتأخرين": late_employees,
                "نسبة الموظفين المتأخرين": f"{late_emp_percentage:.1f}%",
                "عدد حالات التأخير": total_delays,
                "نسبة التأخير (من أيام العمل)": f"{lateness_percentage:.2f}%"
            })
        except Exception as e:
            print(f"Error processing {pdf_file}: {e}")
            results.append({
                "الفرع / الدائرة": branch_raw_name,
                "إجمالي الموظفين": total_emp,
                "عدد الموظفين المتأخرين": "خطأ في المعالجة",
                "نسبة الموظفين المتأخرين": "N/A",
                "عدد حالات التأخير": "N/A",
                "نسبة التأخير (من أيام العمل)": "N/A"
            })

    # Add missing ones from the image that don't have PDFs
    processed_names = [normalize_name(r['الفرع / الدائرة']) for r in results]
    for key, val in total_employees_map.items():
        if normalize_name(key) not in processed_names:
             results.append({
                "الفرع / الدائرة": key + " (لا يوجد ملف PDF)",
                "إجمالي الموظفين": val,
                "عدد الموظفين المتأخرين": 0,
                "نسبة الموظفين المتأخرين": "0.0%",
                "عدد حالات التأخير": 0,
                "نسبة التأخير (من أيام العمل)": "0.00%"
            })

    df = pd.DataFrame(results)
    output_excel = "إحصائيات_التأخير_الشاملة_125_يوم.xlsx"
    df.to_excel(output_excel, index=False)
    print(f"Successfully generated {output_excel}")

if __name__ == "__main__":
    main()
