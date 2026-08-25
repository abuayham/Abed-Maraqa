import os
import json
from generate_super_dashboard import extract_comprehensive_data, get_branch_total_employees, WORKING_DAYS

def generate_html_report():
    print("Extracting data for HTML report...")
    employees, branches_stats = extract_comprehensive_data()
    
    # Sort branches by total delay cases (حالات التأخير) instead of minutes
    branches_stats = sorted(branches_stats, key=lambda x: x['إجمالي حالات التأخير'], reverse=True)
    
    # Sort employees by total delay cases (حالات التأخير)
    employees = sorted(employees, key=lambda x: x['إجمالي حالات التأخير'], reverse=True)
    
    # Prepare dynamic data (calculating percentages)
    for b in branches_stats:
        b['إجمالي موظفي الفرع'] = get_branch_total_employees(b['الفرع'])
        b['نسبة المتأخرين %'] = round((b['إجمالي الموظفين المتأخرين'] / b['إجمالي موظفي الفرع']) * 100, 1) if b['إجمالي موظفي الفرع'] > 0 else 0
        
    for e in employees:
        e['نسبة التأخير %'] = round((e['إجمالي حالات التأخير'] / WORKING_DAYS) * 100, 1) if WORKING_DAYS > 0 else 0
        
    html_content = f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>التقرير الشامل لتأخير الموظفين</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <style>
        body {{ font-family: 'Tajawal', sans-serif; background-color: #f3f4f6; }}
        @media print {{
            @page {{ size: A4 landscape; margin: 10mm; }}
            body {{ background-color: white; zoom: 85%; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }}
            .no-print {{ display: none !important; }}
            .page-break {{ page-break-before: always; }}
            .shadow-lg {{ box-shadow: none !important; }}
            .card {{ border: 1px solid #e5e7eb; }}
        }}
        .table-row:hover {{ background-color: #f9fafb; }}
        .export-table {{ border-collapse: collapse; width: 100%; }}
        .export-table th, .export-table td {{ border: 1px solid #ddd; padding: 8px; text-align: right; }}
        .export-table th {{ background-color: #f2f2f2; font-weight: bold; }}
    </style>
</head>
<body class="text-gray-800">
    <header class="bg-blue-800 text-white shadow-lg print:bg-blue-800 print:text-black print:shadow-none">
        <div class="container mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center">
            <h1 class="text-2xl font-bold mb-4 md:mb-0"><i class="fa-solid fa-chart-pie ml-2"></i> لوحة القيادة التفاعلية لتأخير الموظفين</h1>
            <div class="flex gap-2 no-print flex-wrap justify-center">
                <button onclick="exportToExcel()" class="bg-green-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-green-700 transition">
                    <i class="fa-solid fa-file-excel ml-2"></i> تصدير إكسل
                </button>
                <button onclick="exportToWord()" class="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-blue-700 transition border border-blue-400">
                    <i class="fa-solid fa-file-word ml-2"></i> تصدير وورد
                </button>
                <button onclick="exportToPDF()" class="bg-red-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-red-700 transition">
                    <i class="fa-solid fa-file-pdf ml-2"></i> تصدير PDF
                </button>
                <button onclick="window.print()" class="bg-white text-blue-800 px-4 py-2 rounded-lg font-bold shadow hover:bg-gray-100 transition border border-gray-300">
                    <i class="fa-solid fa-print ml-2"></i> طباعة
                </button>
            </div>
        </div>
    </header>

    <main class="container mx-auto px-6 py-8" id="reportContent">
        <section class="no-print mb-8">
            <div class="bg-white p-6 rounded-xl shadow-md flex flex-col md:flex-row items-center justify-between border-t-4 border-blue-600">
                <h2 class="text-lg font-bold text-gray-700 mb-4 md:mb-0"><i class="fa-solid fa-filter ml-2"></i> تصفية التقرير الشامل</h2>
                <select id="branchFilter" onchange="renderAll()" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full md:w-80 p-2.5">
                    <option value="all_by_emp">عرض جميع الفروع (حسب ترتيب الموظفين)</option>
                    <option value="all_by_branch">عرض جميع الفروع (حسب ترتيب الفرع)</option>
"""
    for b in branches_stats:
        html_content += f"""<option value="{b['الفرع']}">{b['الفرع']}</option>"""
        
    html_content += """
                </select>
            </div>
        </section>

        <div id="pdfExportArea">
            <div id="pdfHeader" style="display:none; text-align:center; margin-bottom:20px;">
                <h1 style="color:#1e3a8a; font-size:24px; font-weight:bold;">التقرير الشامل لتأخير الموظفين</h1>
                <h2 style="color:#4b5563; font-size:16px;" id="pdfFilterSubtitle"></h2>
            </div>

            <!-- KPI Cards -->
            <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8" id="kpiContainer"></section>

            <!-- Branches Summary Table -->
            <section class="bg-white rounded-xl shadow-md overflow-hidden mb-8 border border-gray-100 card" id="branchesSection">
                <div class="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 class="text-xl font-bold text-gray-800"><i class="fa-solid fa-building ml-2 text-blue-600"></i> ملخص الفروع والدوائر (مرتب حسب حالات التأخير)</h2>
                    <button onclick="exportBranchesSummaryToWord()" class="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow hover:bg-blue-700 transition">
                        <i class="fa-solid fa-file-word mr-1"></i> تصدير ملخص الفروع
                    </button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-right text-gray-600">
                        <thead class="text-xs text-white uppercase bg-blue-600">
                            <tr>
                                <th class="px-6 py-4 font-bold rounded-tr-lg">الفرع / الدائرة</th>
                                <th class="px-6 py-4 font-bold text-center">إجمالي حالات التأخير</th>
                                <th class="px-6 py-4 font-bold text-center">إجمالي الدقائق</th>
                                <th class="px-6 py-4 font-bold text-center">إجمالي الساعات</th>
                                <th class="px-6 py-4 font-bold text-center">متوسط التأخير (د)</th>
                                <th class="px-6 py-4 font-bold text-center">إجمالي موظفي الفرع</th>
                                <th class="px-6 py-4 font-bold text-center">المتأخرون</th>
                                <th class="px-6 py-4 font-bold text-center">نسبة المتأخرين %</th>
                                <th class="px-6 py-4 font-bold">الموظف الأكثر تأخيراً</th>
                                <th class="px-6 py-4 font-bold rounded-tl-lg">اليوم الأكثر تكراراً</th>
                            </tr>
                        </thead>
                        <tbody id="branchesTableBody" class="divide-y divide-gray-200"></tbody>
                    </table>
                </div>
            </section>

            <!-- Employees Details Table -->
            <section id="employeesSection" class="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 card page-break">
                <div class="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 class="text-xl font-bold text-gray-800"><i class="fa-solid fa-users ml-2 text-blue-600"></i> تفاصيل الموظفين</h2>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-right text-gray-600">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-100 border-b-2 border-gray-300">
                            <tr>
                                <th class="px-6 py-4 font-bold">#</th>
                                <th class="px-6 py-4 font-bold">الفرع / الدائرة</th>
                                <th class="px-6 py-4 font-bold">اسم الموظف</th>
                                <th class="px-6 py-4 font-bold text-center">حالات التأخير</th>
                                <th class="px-6 py-4 font-bold text-center">إجمالي الدقائق</th>
                                <th class="px-6 py-4 font-bold text-center">إجمالي الساعات</th>
                                <th class="px-6 py-4 font-bold text-center">متوسط التأخير (د)</th>
                                <th class="px-6 py-4 font-bold text-center">الأشهر المسجلة</th>
                                <th class="px-6 py-4 font-bold text-center">نسبة التأخير %</th>
                            </tr>
                        </thead>
                        <tbody id="employeesTableBody" class="divide-y divide-gray-200"></tbody>
                    </table>
                </div>
            </section>
        </div>
    </main>

    <script>
        const rawBranchesData = """ + json.dumps(branches_stats, ensure_ascii=False) + """;
        const rawEmployeesData = """ + json.dumps(employees, ensure_ascii=False) + """;
        const WORKING_DAYS = """ + str(WORKING_DAYS) + """;
        
        function formatMinutes(minutes) {
            const h = Math.floor(minutes / 60);
            const m = minutes % 60;
            return h > 0 ? `${h} ساعة و ${m} دقيقة` : `${m} دقيقة`;
        }

        let currentEmployees = [];
        let currentBranches = [];
        
        function renderAll() {
            const filter = document.getElementById('branchFilter').value;
            
            // Filter Data
            let fBranches = filter.startsWith('all') ? [...rawBranchesData] : rawBranchesData.filter(b => b['الفرع'] === filter);
            if (filter === 'all_by_branch') {
                fBranches.sort((a,b) => b['إجمالي حالات التأخير'] - a['إجمالي حالات التأخير']);
            }
            
            let fEmployees = [];
            
            if (filter === 'all_by_emp') {
                fEmployees = [...rawEmployeesData].sort((a,b) => b['إجمالي حالات التأخير'] - a['إجمالي حالات التأخير']);
            } else if (filter === 'all_by_branch') {
                fEmployees = [...rawEmployeesData].sort((a,b) => {
                    // First sort by the branch's total lateness incidents
                    const branchA = rawBranchesData.find(br => br['الفرع'] === a['الفرع']);
                    const branchB = rawBranchesData.find(br => br['الفرع'] === b['الفرع']);
                    const branchCasesDiff = (branchB ? branchB['إجمالي حالات التأخير'] : 0) - (branchA ? branchA['إجمالي حالات التأخير'] : 0);
                    if (branchCasesDiff !== 0) return branchCasesDiff;
                    
                    // Then sort by employee lateness incidents
                    return b['إجمالي حالات التأخير'] - a['إجمالي حالات التأخير'];
                });
            } else {
                fEmployees = rawEmployeesData.filter(e => e['الفرع'] === filter);
            }
            
            currentEmployees = fEmployees;
            currentBranches = fBranches;
            
            // KPIs
            const totalEmployees = fEmployees.length;
            const totalDelayCases = fEmployees.reduce((sum, e) => sum + e['إجمالي حالات التأخير'], 0);
            const totalMinutes = fEmployees.reduce((sum, e) => sum + e['إجمالي الدقائق'], 0);
            const totalHours = Math.round(totalMinutes / 60);
            
            let allUnivEmp = 0;
            let empLabel = "إجمالي الموظفين الكلي";
            let pctLabel = "نسبة التأخير الكلي";
            
            if (!filter.startsWith('all')) {
                const branchStat = rawBranchesData.find(b => b['الفرع'] === filter);
                if (branchStat) {
                    allUnivEmp = branchStat['إجمالي موظفي الفرع'];
                }
                empLabel = "إجمالي موظفي الفرع";
                pctLabel = "نسبة التأخير بالفرع";
            } else {
                allUnivEmp = rawBranchesData.reduce((sum, b) => sum + b['إجمالي موظفي الفرع'], 0);
            }
            
            const univDelayPct = allUnivEmp > 0 ? ((totalEmployees / allUnivEmp) * 100).toFixed(1) : 0;
            
            document.getElementById('kpiContainer').innerHTML = `
                <div class="bg-white rounded-xl shadow-sm p-4 border-b-4 border-teal-500 card">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-teal-100 text-teal-600 ml-3"><i class="fa-solid fa-users"></i></div>
                        <div><p class="text-xs text-gray-500 font-medium">${empLabel}</p><p class="text-xl font-bold text-gray-800 kpi-val">${allUnivEmp.toLocaleString()}</p></div>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm p-4 border-b-4 border-rose-500 card">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-rose-100 text-rose-600 ml-3"><i class="fa-solid fa-percent"></i></div>
                        <div><p class="text-xs text-gray-500 font-medium">${pctLabel}</p><p class="text-xl font-bold text-gray-800 kpi-val">${univDelayPct}%</p></div>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm p-4 border-b-4 border-red-500 card">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-red-100 text-red-600 ml-3"><i class="fa-solid fa-user-clock"></i></div>
                        <div><p class="text-xs text-gray-500 font-medium">الموظفين المتأخرين</p><p class="text-xl font-bold text-gray-800 kpi-val">${totalEmployees.toLocaleString()}</p></div>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm p-4 border-b-4 border-orange-500 card">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-orange-100 text-orange-600 ml-3"><i class="fa-solid fa-triangle-exclamation"></i></div>
                        <div><p class="text-xs text-gray-500 font-medium">إجمالي الحالات</p><p class="text-xl font-bold text-gray-800 kpi-val">${totalDelayCases.toLocaleString()}</p></div>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm p-4 border-b-4 border-purple-500 card">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-purple-100 text-purple-600 ml-3"><i class="fa-solid fa-clock"></i></div>
                        <div><p class="text-xs text-gray-500 font-medium">إجمالي الدقائق</p><p class="text-xl font-bold text-gray-800 kpi-val">${totalMinutes.toLocaleString()}</p></div>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm p-4 border-b-4 border-indigo-500 card">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-indigo-100 text-indigo-600 ml-3"><i class="fa-solid fa-hourglass-half"></i></div>
                        <div><p class="text-xs text-gray-500 font-medium">إجمالي الساعات</p><p class="text-xl font-bold text-gray-800 kpi-val">${totalHours.toLocaleString()}</p></div>
                    </div>
                </div>
            `;
            
            // Render Branches
            if (!filter.startsWith('all')) document.getElementById('branchesSection').style.display = 'none';
            else {
                document.getElementById('branchesSection').style.display = 'block';
                const tb = document.getElementById('branchesTableBody');
                tb.innerHTML = '';
                fBranches.forEach(b => {
                    const pctClass = b['نسبة المتأخرين %'] >= 50 ? 'text-red-600 font-bold bg-red-50' : 'text-gray-900';
                    tb.innerHTML += `
                        <tr class="table-row transition-colors">
                            <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">${b['الفرع']}</td>
                            <td class="px-6 py-4 text-center font-bold text-blue-600">${b['إجمالي حالات التأخير'].toLocaleString()}</td>
                            <td class="px-6 py-4 text-center">${b['إجمالي الدقائق'].toLocaleString()}</td>
                            <td class="px-6 py-4 text-center font-bold">${b['إجمالي الساعات'].toLocaleString()}</td>
                            <td class="px-6 py-4 text-center">${b['متوسط دقائق التأخير']}</td>
                            <td class="px-6 py-4 text-center">${b['إجمالي موظفي الفرع']}</td>
                            <td class="px-6 py-4 text-center">${b['إجمالي الموظفين المتأخرين']}</td>
                            <td class="px-6 py-4 text-center ${pctClass}">${b['نسبة المتأخرين %']}%</td>
                            <td class="px-6 py-4 text-sm">${b['الموظف الأكثر تأخيراً']}</td>
                            <td class="px-6 py-4 text-sm font-medium text-gray-500">${b['اليوم الأكثر تكراراً']}</td>
                        </tr>
                    `;
                });
            }

            // Render Employees
            const empContainer = document.getElementById('employeesSection');
            
            // We will dynamically build the tables
            if (filter === 'all_by_branch') {
                let html = '';
                let currentBranch = '';
                let branchIndex = 1;
                
                fEmployees.forEach((e, i) => {
                    if (e['الفرع'] !== currentBranch) {
                        if (currentBranch !== '') {
                            html += `</tbody></table></div></div>`; // Close previous table and container
                        }
                        currentBranch = e['الفرع'];
                        branchIndex = 1;
                        
                        const bStats = rawBranchesData.find(b => b['الفرع'] === currentBranch);
                        let summaryHtml = '';
                        if (bStats) {
                            summaryHtml = `
                                <div class="flex flex-wrap gap-3 mt-3 text-xs text-blue-900">
                                    <span class="bg-white px-3 py-1.5 rounded-full shadow-sm border border-blue-200">👥 موظفي الفرع: <b>${bStats['إجمالي موظفي الفرع']}</b></span>
                                    <span class="bg-white px-3 py-1.5 rounded-full shadow-sm border border-blue-200">⚠️ المتأخرين: <b>${bStats['إجمالي الموظفين المتأخرين']}</b></span>
                                    <span class="bg-white px-3 py-1.5 rounded-full shadow-sm border border-blue-200">📈 نسبة التأخير: <b>${bStats['نسبة المتأخرين %']}%</b></span>
                                    <span class="bg-white px-3 py-1.5 rounded-full shadow-sm border border-blue-200">⏱️ حالات التأخير: <b>${bStats['إجمالي حالات التأخير'].toLocaleString()}</b></span>
                                    <span class="bg-white px-3 py-1.5 rounded-full shadow-sm border border-blue-200">⏳ الدقائق: <b>${bStats['إجمالي الدقائق'].toLocaleString()}</b></span>
                                    <span class="bg-white px-3 py-1.5 rounded-full shadow-sm border border-blue-200">⌛ الساعات: <b>${bStats['إجمالي الساعات'].toLocaleString()}</b></span>
                                    <span class="bg-white px-3 py-1.5 rounded-full shadow-sm border border-blue-200">📌 متوسط التأخير: <b>${bStats['متوسط دقائق التأخير']}</b></span>
                                    <span class="bg-white px-3 py-1.5 rounded-full shadow-sm border border-red-200 text-red-800">👤 الأكثر تأخيراً: <b>${bStats['الموظف الأكثر تأخيراً']}</b></span>
                                    <span class="bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-300">📅 يوم الذروة: <b>${bStats['اليوم الأكثر تكراراً']}</b></span>
                                </div>
                            `;
                        }
                        
                        html += `
                        <div class="branch-section-container" data-branch-name="${currentBranch}">
                            <div class="branch-group mt-10 mb-2 page-break">
                                <div class="flex justify-between items-center border-b-4 border-blue-500 pb-2 mb-2">
                                    <h2 class="text-3xl font-extrabold text-blue-900 inline-block">${currentBranch}</h2>
                                    <button onclick="exportSingleBranchToWord('${currentBranch.replace(/'/g, "\\'")}')" class="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow hover:bg-blue-700 transition">
                                        <i class="fa-solid fa-file-word mr-1"></i> تصدير الفرع
                                    </button>
                                </div>
                                ${summaryHtml}
                            </div>
                            <div class="overflow-x-auto shadow-md rounded-lg mb-6 border border-gray-200">
                                <table class="w-full text-sm text-right text-gray-600 branch-table">
                                <thead class="text-xs text-gray-700 uppercase bg-gray-100 border-b-2 border-gray-300">
                                    <tr>
                                        <th class="px-6 py-4 font-bold">#</th>
                                        <th class="px-6 py-4 font-bold">اسم الموظف</th>
                                        <th class="px-6 py-4 font-bold text-center">حالات التأخير</th>
                                        <th class="px-6 py-4 font-bold text-center">إجمالي الدقائق</th>
                                        <th class="px-6 py-4 font-bold text-center">إجمالي الساعات</th>
                                        <th class="px-6 py-4 font-bold text-center">متوسط التأخير (د)</th>
                                        <th class="px-6 py-4 font-bold text-center">الأشهر المسجلة</th>
                                        <th class="px-6 py-4 font-bold text-center">نسبة التأخير %</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200 bg-white">
                        `;
                    }
                    
                    let rank = branchIndex++;
                    let badgeClass = rank <= 3 ? 'bg-red-100 text-red-800 font-bold border border-red-200' : 'bg-gray-50 text-gray-600';
                    
                    html += `
                        <tr class="transition-colors hover:bg-gray-50">
                            <td class="px-6 py-3 whitespace-nowrap"><span class="px-2 py-1 rounded-md text-xs ${badgeClass}">${rank}</span></td>
                            <td class="px-6 py-3 font-bold text-gray-900">${e['اسم الموظف']}</td>
                            <td class="px-6 py-3 text-center font-bold text-blue-600">${e['إجمالي حالات التأخير']}</td>
                            <td class="px-6 py-3 text-center">${e['إجمالي الدقائق'].toLocaleString()}</td>
                            <td class="px-6 py-3 text-center font-bold">${e['إجمالي الساعات'].toLocaleString()}</td>
                            <td class="px-6 py-3 text-center">${e['متوسط دقائق التأخير']}</td>
                            <td class="px-6 py-3 text-center"><span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">${e['الأشهر المسجلة']}</span></td>
                            <td class="px-6 py-3 text-center font-medium">${e['نسبة التأخير %']}%</td>
                        </tr>
                    `;
                });
                if (html !== '') {
                    html += `</tbody></table></div></div>`;
                }
                empContainer.innerHTML = html;
                
            } else {
                // Render standard single table for other filters
                let html = `
                <div class="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 class="text-xl font-bold text-gray-800"><i class="fa-solid fa-users ml-2 text-blue-600"></i> تفاصيل الموظفين</h2>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-right text-gray-600 branch-table">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-100 border-b-2 border-gray-300">
                            <tr>
                                <th class="px-6 py-4 font-bold">#</th>
                                <th class="px-6 py-4 font-bold">الفرع / الدائرة</th>
                                <th class="px-6 py-4 font-bold">اسم الموظف</th>
                                <th class="px-6 py-4 font-bold text-center">حالات التأخير</th>
                                <th class="px-6 py-4 font-bold text-center">إجمالي الدقائق</th>
                                <th class="px-6 py-4 font-bold text-center">إجمالي الساعات</th>
                                <th class="px-6 py-4 font-bold text-center">متوسط التأخير (د)</th>
                                <th class="px-6 py-4 font-bold text-center">الأشهر المسجلة</th>
                                <th class="px-6 py-4 font-bold text-center">نسبة التأخير %</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 bg-white">
                `;
                fEmployees.forEach((e, i) => {
                    const badgeClass = i < 5 && filter.startsWith('all') ? 'bg-red-100 text-red-800 font-bold border border-red-200' : 'bg-gray-50 text-gray-600';
                    html += `
                        <tr class="transition-colors hover:bg-gray-50">
                            <td class="px-6 py-3 whitespace-nowrap"><span class="px-2 py-1 rounded-md text-xs ${badgeClass}">${i + 1}</span></td>
                            <td class="px-6 py-3 font-medium text-gray-700">${e['الفرع']}</td>
                            <td class="px-6 py-3 font-bold text-gray-900">${e['اسم الموظف']}</td>
                            <td class="px-6 py-3 text-center font-bold text-blue-600">${e['إجمالي حالات التأخير']}</td>
                            <td class="px-6 py-3 text-center">${e['إجمالي الدقائق'].toLocaleString()}</td>
                            <td class="px-6 py-3 text-center font-bold">${e['إجمالي الساعات'].toLocaleString()}</td>
                            <td class="px-6 py-3 text-center">${e['متوسط دقائق التأخير']}</td>
                            <td class="px-6 py-3 text-center"><span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">${e['الأشهر المسجلة']}</span></td>
                            <td class="px-6 py-3 text-center font-medium">${e['نسبة التأخير %']}%</td>
                        </tr>
                    `;
                });
                html += `</tbody></table></div>`;
                empContainer.innerHTML = html;
            }
        }

        function generateExportHTML(specificBranchName = null, onlySummary = false) {
            const branchFilter = document.getElementById('branchFilter');
            let filterText = branchFilter.options[branchFilter.selectedIndex].text;
            if (specificBranchName) {
                filterText = specificBranchName;
            }
            
            // Get KPIs
            let kpiHtml = '';
            let vals = [];
            let kpiLabels = [
                specificBranchName ? "إجمالي موظفي الفرع" : "إجمالي الموظفين الكلي",
                specificBranchName ? "نسبة التأخير بالفرع" : "نسبة التأخير الكلي",
                "الموظفين المتأخرين",
                "إجمالي الحالات",
                "إجمالي الدقائق",
                "إجمالي الساعات"
            ];

            if (specificBranchName) {
                const bStats = rawBranchesData.find(b => b['الفرع'] === specificBranchName);
                if (bStats) {
                    vals = [
                        bStats['إجمالي موظفي الفرع'].toLocaleString(),
                        bStats['نسبة المتأخرين %'] + "%",
                        bStats['إجمالي الموظفين المتأخرين'].toLocaleString(),
                        bStats['إجمالي حالات التأخير'].toLocaleString(),
                        bStats['إجمالي الدقائق'].toLocaleString(),
                        bStats['إجمالي الساعات'].toLocaleString()
                    ];
                }
            } else {
                const kpiCards = document.querySelectorAll('#kpiContainer .card');
                if (kpiCards.length === 6) {
                    vals = Array.from(kpiCards).map(c => c.querySelector('.kpi-val').innerText);
                }
            }

            if (vals.length === 6) {
                kpiHtml = `
                <table style="width:100%; margin-bottom:20px; border-collapse: collapse; border: none;">
                    <tr>
                        <td style="border:1px solid #ddd; padding:10px; background-color:#ccfbf1; text-align:center; width:16.6%;">
                            <div style="color:#0f766e; font-weight:bold; font-size:18px;">${vals[0]}</div>
                            <div style="color:#6b7280; font-size:12px; font-weight:bold;">${kpiLabels[0]}</div>
                        </td>
                        <td style="border:1px solid #ddd; padding:10px; background-color:#ffe4e6; text-align:center; width:16.6%;">
                            <div style="color:#be123c; font-weight:bold; font-size:18px;">${vals[1]}</div>
                            <div style="color:#6b7280; font-size:12px; font-weight:bold;">${kpiLabels[1]}</div>
                        </td>
                        <td style="border:1px solid #ddd; padding:10px; background-color:#fee2e2; text-align:center; width:16.6%;">
                            <div style="color:#b91c1c; font-weight:bold; font-size:18px;">${vals[2]}</div>
                            <div style="color:#6b7280; font-size:12px; font-weight:bold;">${kpiLabels[2]}</div>
                        </td>
                        <td style="border:1px solid #ddd; padding:10px; background-color:#ffedd5; text-align:center; width:16.6%;">
                            <div style="color:#c2410c; font-weight:bold; font-size:18px;">${vals[3]}</div>
                            <div style="color:#6b7280; font-size:12px; font-weight:bold;">${kpiLabels[3]}</div>
                        </td>
                        <td style="border:1px solid #ddd; padding:10px; background-color:#faf5ff; text-align:center; width:16.6%;">
                            <div style="color:#7e22ce; font-weight:bold; font-size:18px;">${vals[4]}</div>
                            <div style="color:#6b7280; font-size:12px; font-weight:bold;">${kpiLabels[4]}</div>
                        </td>
                        <td style="border:1px solid #ddd; padding:10px; background-color:#e0e7ff; text-align:center; width:16.6%;">
                            <div style="color:#4338ca; font-weight:bold; font-size:18px;">${vals[5]}</div>
                            <div style="color:#6b7280; font-size:12px; font-weight:bold;">${kpiLabels[5]}</div>
                        </td>
                    </tr>
                </table>
                `;
            }

            // Process Employees Table
            const empContainerClone = document.getElementById('employeesSection').cloneNode(true);
            
            if (specificBranchName) {
                const branchSections = empContainerClone.querySelectorAll('.branch-section-container');
                branchSections.forEach(section => {
                    if (section.getAttribute('data-branch-name') !== specificBranchName) {
                        section.remove();
                    }
                });
            }
                
            // Clean up tailwind classes and inject inline styles
            const exportBtns = empContainerClone.querySelectorAll('button');
            exportBtns.forEach(btn => btn.remove());
            const branchGroups = empContainerClone.querySelectorAll('.branch-group');
            branchGroups.forEach(bg => {
                bg.style.marginTop = '30px';
                bg.style.marginBottom = '10px';
                const h2 = bg.querySelector('h2');
                if (h2) {
                    h2.style.fontSize = '24px';
                    h2.style.fontWeight = 'bold';
                    h2.style.color = '#1e3a8a';
                    h2.style.borderBottom = '3px solid #3b82f6';
                    h2.style.paddingBottom = '5px';
                    h2.style.marginBottom = '10px';
                    h2.style.display = 'block';
                }
            });
                
            const rows = empContainerClone.querySelectorAll('tr');
            rows.forEach(row => {
                const tds = row.querySelectorAll('td');
                tds.forEach(td => {
                    if (td.innerText.includes('%')) {
                        const val = parseFloat(td.innerText.replace('%', '').trim());
                        if (!isNaN(val) && val > 50) {
                            td.style.color = '#b91c1c';
                            td.style.backgroundColor = '#fee2e2';
                            td.style.fontWeight = 'bold';
                        }
                    }
                });
                const spans = row.querySelectorAll('span');
                spans.forEach(span => {
                    if (span.classList.contains('bg-red-100')) {
                        span.style.backgroundColor = '#fee2e2';
                        span.style.color = '#991b1b';
                        span.style.fontWeight = 'bold';
                        span.style.padding = '2px 6px';
                        span.style.borderRadius = '4px';
                    } else if (span.classList.contains('bg-blue-100')) {
                        span.style.backgroundColor = '#dbeafe';
                        span.style.color = '#1e40af';
                        span.style.padding = '2px 6px';
                        span.style.borderRadius = '4px';
                    } else if (span.classList.contains('bg-white')) {
                        span.style.backgroundColor = '#ffffff';
                        span.style.color = '#1e3a8a';
                        span.style.border = '1px solid #bfdbfe';
                        span.style.padding = '4px 10px';
                        span.style.borderRadius = '15px';
                        span.style.display = 'inline-block';
                        span.style.margin = '4px';
                        span.style.fontSize = '12px';
                    }
                });
            });

            let html = `
            <div style="direction: rtl; font-family: 'Arial', sans-serif;">
                <h1 style="text-align:center; color:#1e3a8a; font-size:26px; margin-bottom:5px; font-weight:bold;">التقرير الشامل لتأخير الموظفين</h1>
                <h2 style="text-align:center; color:#4b5563; font-size:18px; margin-bottom:5px;">${filterText}</h2>
                <h3 style="text-align:center; color:#6b7280; font-size:14px; margin-bottom:20px;">البيانات للفترة من 1/1/2026 ولغاية 8/7/2026</h3>
                ${kpiHtml}
            `;

            if (document.getElementById('branchesSection').style.display !== 'none') {
                const brTable = document.getElementById('branchesTableBody').parentElement.cloneNode(true);
                const tds = brTable.querySelectorAll('td');
                tds.forEach(td => {
                    if (td.innerText.includes('%')) {
                        const val = parseFloat(td.innerText.replace('%', '').trim());
                        if (!isNaN(val) && val > 50) {
                            td.style.color = '#b91c1c';
                            td.style.backgroundColor = '#fee2e2';
                            td.style.fontWeight = 'bold';
                        }
                    }
                });
                html += `<h2 style="color:#1e3a8a; font-size:20px; font-weight:bold; border-bottom: 2px solid #1e3a8a; padding-bottom:5px;">ملخص الفروع والدوائر</h2>`;
                html += brTable.outerHTML;
                html += `<br><br>`;
            }

            if (!onlySummary) {
                html += `<h2 style="color:#1e3a8a; font-size:20px; font-weight:bold; border-bottom: 2px solid #1e3a8a; padding-bottom:5px;">تفاصيل الموظفين</h2>`;
                html += empContainerClone.innerHTML;
            }
            html += `</div>`;
            return html;
        }

        function exportToWord() {
            const exportHtml = generateExportHTML();
            const content = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                    <meta charset="utf-8">
                    <title>تقرير التأخيرات</title>
                    <style>
                        body { font-family: 'Arial', sans-serif; direction: rtl; }
                        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; font-size: 11px; }
                        th, td { border: 1px solid #94a3b8; padding: 8px; text-align: center; vertical-align: middle; }
                        th { background-color: #1e3a8a; color: white; font-weight: bold; }
                        tr:nth-child(even) { background-color: #f8fafc; }
                        @page WordSection1 {
                            size: 29.7cm 21cm; /* Landscape */
                            mso-page-orientation: landscape;
                            margin: 1cm 1cm 1cm 1cm;
                            mso-header-margin: 35.4pt; mso-footer-margin: 35.4pt;
                            mso-footer: f1;
                        }
                        div.WordSection1 { page: WordSection1; }
                    </style>
                </head>
                <body>
                    <div class="WordSection1">
                        ${exportHtml}
                    </div>
                    <div style="mso-element:footer" id="f1">
                        <p style="text-align:center; color:#6b7280; font-size:10px;">
                            الصفحة <span style="mso-field-code:' PAGE '"></span> من <span style="mso-field-code:' NUMPAGES '"></span>
                        </p>
                    </div>
                </body>
                </html>
            `;
            const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const branchFilter = document.getElementById('branchFilter');
            const branchName = branchFilter.options[branchFilter.selectedIndex].text;
            const fileName = `تقرير_التأخيرات_${branchName.replace(/[\\\\/?*\\[\\]:]/g, '')}.doc`;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        function exportSingleBranchToWord(branchName) {
            const exportHtml = generateExportHTML(branchName);
            const content = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                    <meta charset="utf-8">
                    <title>تقرير التأخيرات - ${branchName}</title>
                    <style>
                        body { font-family: 'Arial', sans-serif; direction: rtl; }
                        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; font-size: 11px; }
                        th, td { border: 1px solid #94a3b8; padding: 8px; text-align: center; vertical-align: middle; }
                        th { background-color: #1e3a8a; color: white; font-weight: bold; }
                        tr:nth-child(even) { background-color: #f8fafc; }
                        @page WordSection1 {
                            size: 29.7cm 21cm; /* Landscape */
                            mso-page-orientation: landscape;
                            margin: 1cm 1cm 1cm 1cm;
                            mso-header-margin: 35.4pt; mso-footer-margin: 35.4pt;
                            mso-footer: f1;
                        }
                        div.WordSection1 { page: WordSection1; }
                    </style>
                </head>
                <body>
                    <div class="WordSection1">
                        ${exportHtml}
                    </div>
                    <div style="mso-element:footer" id="f1">
                        <p style="text-align:center; color:#6b7280; font-size:10px;">
                            الصفحة <span style="mso-field-code:' PAGE '"></span> من <span style="mso-field-code:' NUMPAGES '"></span>
                        </p>
                    </div>
                </body>
                </html>
            `;
            const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const fileName = `تقرير_تأخيرات_${branchName.replace(/[\\\\/?*\\[\\]:]/g, '')}.doc`;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        function exportBranchesSummaryToWord() {
            const exportHtml = generateExportHTML(null, true);
            const content = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                    <meta charset="utf-8">
                    <title>ملخص تأخيرات الفروع والدوائر</title>
                    <style>
                        body { font-family: 'Arial', sans-serif; direction: rtl; }
                        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; font-size: 11px; }
                        th, td { border: 1px solid #94a3b8; padding: 8px; text-align: center; vertical-align: middle; }
                        th { background-color: #1e3a8a; color: white; font-weight: bold; }
                        tr:nth-child(even) { background-color: #f8fafc; }
                        @page WordSection1 {
                            size: 29.7cm 21cm; /* Landscape */
                            mso-page-orientation: landscape;
                            margin: 1cm 1cm 1cm 1cm;
                            mso-header-margin: 35.4pt; mso-footer-margin: 35.4pt;
                            mso-footer: f1;
                        }
                        div.WordSection1 { page: WordSection1; }
                    </style>
                </head>
                <body>
                    <div class="WordSection1">
                        ${exportHtml}
                    </div>
                    <div style="mso-element:footer" id="f1">
                        <p style="text-align:center; color:#6b7280; font-size:10px;">
                            الصفحة <span style="mso-field-code:' PAGE '"></span> من <span style="mso-field-code:' NUMPAGES '"></span>
                        </p>
                    </div>
                </body>
                </html>
            `;
            const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const fileName = `تقرير_ملخص_الفروع_والدوائر.doc`;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        function exportToExcel() {
            const wb = XLSX.utils.book_new();
            wb.Workbook = { Views: [{ RTL: true }] };
            const ws_data = [];
            
            const branchFilter = document.getElementById('branchFilter');
            const filterText = branchFilter.options[branchFilter.selectedIndex].text;
            const filterValue = branchFilter.value;
            
            // Recompute KPIs matching renderAll
            const totalEmployees = currentEmployees.length;
            const totalDelayCases = currentEmployees.reduce((sum, e) => sum + e['إجمالي حالات التأخير'], 0);
            const totalMinutes = currentEmployees.reduce((sum, e) => sum + e['إجمالي الدقائق'], 0);
            const totalHours = Math.round(totalMinutes / 60);
            const allUnivEmp = rawBranchesData.reduce((sum, b) => sum + b['إجمالي موظفي الفرع'], 0);
            const univDelayPct = allUnivEmp > 0 ? ((totalEmployees / allUnivEmp) * 100).toFixed(1) : 0;
            
            // --- Helper styles ---
            const sTitle = { font: { sz: 20, bold: true, color: { rgb: "1E3A8A" } }, alignment: { horizontal: "center", vertical: "center" } };
            const sSubtitle = { font: { sz: 14, bold: true, color: { rgb: "4B5563" } }, alignment: { horizontal: "center", vertical: "center" } };
            const sHeaderBlue = { font: { sz: 12, bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "1E3A8A" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
            const sHeaderGray = { font: { sz: 11, bold: true, color: { rgb: "374151" } }, fill: { fgColor: { rgb: "F3F4F6" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
            const sCell = { font: { sz: 11 }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
            const sCellBold = { font: { sz: 11, bold: true }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
            const sCellRed = { font: { sz: 11, bold: true, color: { rgb: "B91C1C" } }, fill: { fgColor: { rgb: "FEE2E2" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
            const sCellBlue = { font: { sz: 11, bold: true, color: { rgb: "1D4ED8" } }, fill: { fgColor: { rgb: "DBEAFE" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
            
            // Build KPIs Row
            const sKpiVal = { font: { sz: 16, bold: true, color: { rgb: "1E3A8A" } }, fill: { fgColor: { rgb: "EFF6FF" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
            const sKpiLabel = { font: { sz: 11, bold: true, color: { rgb: "4B5563" } }, fill: { fgColor: { rgb: "EFF6FF" } }, alignment: { horizontal: "center", vertical: "center" }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };

            ws_data.push([{ v: "التقرير الشامل لتأخير الموظفين", s: sTitle }, null, null, null, null, null, null, null, null]);
            ws_data.push([{ v: filterText, s: sSubtitle }, null, null, null, null, null, null, null, null]);
            ws_data.push([]); // empty
            
            // KPI values
            ws_data.push([
                { v: allUnivEmp, t: 'n', s: {...sKpiVal, font: { ...sKpiVal.font, color: { rgb: "0F766E" } }, fill: { fgColor: { rgb: "CCFBF1" } } } }, null,
                { v: univDelayPct + "%", t: 's', s: {...sKpiVal, font: { ...sKpiVal.font, color: { rgb: "BE123C" } }, fill: { fgColor: { rgb: "FFE4E6" } } } }, null,
                { v: totalEmployees, t: 'n', s: {...sKpiVal, font: { ...sKpiVal.font, color: { rgb: "B91C1C" } }, fill: { fgColor: { rgb: "FEE2E2" } } } }, null,
                { v: totalDelayCases, t: 'n', s: {...sKpiVal, font: { ...sKpiVal.font, color: { rgb: "C2410C" } }, fill: { fgColor: { rgb: "FFEDD5" } } } }, null,
                { v: totalMinutes, t: 'n', s: {...sKpiVal, font: { ...sKpiVal.font, color: { rgb: "7E22CE" } }, fill: { fgColor: { rgb: "FAF5FF" } } } }, null,
                { v: totalHours, t: 'n', s: {...sKpiVal, font: { ...sKpiVal.font, color: { rgb: "4338CA" } }, fill: { fgColor: { rgb: "E0E7FF" } } } }, null
            ]);
            
            // KPI Labels
            ws_data.push([
                { v: "إجمالي الموظفين الكلي", s: {...sKpiLabel, fill: { fgColor: { rgb: "CCFBF1" } } } }, null,
                { v: "نسبة التأخير الكلي", s: {...sKpiLabel, fill: { fgColor: { rgb: "FFE4E6" } } } }, null,
                { v: "الموظفين المتأخرين", s: {...sKpiLabel, fill: { fgColor: { rgb: "FEE2E2" } } } }, null,
                { v: "إجمالي الحالات", s: {...sKpiLabel, fill: { fgColor: { rgb: "FFEDD5" } } } }, null,
                { v: "إجمالي الدقائق", s: {...sKpiLabel, fill: { fgColor: { rgb: "FAF5FF" } } } }, null,
                { v: "إجمالي الساعات", s: {...sKpiLabel, fill: { fgColor: { rgb: "E0E7FF" } } } }, null
            ]);
            
            ws_data.push([]);
            ws_data.push([]);

            // Define Merges (title, subtitle, kpis)
            const merges = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
                // Merge KPI pairs
                { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } }, { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } },
                { s: { r: 3, c: 2 }, e: { r: 3, c: 3 } }, { s: { r: 4, c: 2 }, e: { r: 4, c: 3 } },
                { s: { r: 3, c: 4 }, e: { r: 3, c: 5 } }, { s: { r: 4, c: 4 }, e: { r: 4, c: 5 } },
                { s: { r: 3, c: 6 }, e: { r: 3, c: 7 } }, { s: { r: 4, c: 6 }, e: { r: 4, c: 7 } },
                { s: { r: 3, c: 8 }, e: { r: 3, c: 9 } }, { s: { r: 4, c: 8 }, e: { r: 4, c: 9 } },
                { s: { r: 3, c: 10 }, e: { r: 3, c: 11 } }, { s: { r: 4, c: 10 }, e: { r: 4, c: 11 } },
            ];
            
            let rowIdx = ws_data.length;

            const pushHeaderRow = () => {
                ws_data.push([
                    { v: "#", s: sHeaderGray },
                    { v: "الفرع / الدائرة", s: sHeaderGray },
                    { v: "اسم الموظف", s: sHeaderGray },
                    { v: "حالات التأخير", s: sHeaderGray },
                    { v: "إجمالي الدقائق", s: sHeaderGray },
                    { v: "إجمالي الساعات", s: sHeaderGray },
                    { v: "متوسط التأخير (د)", s: sHeaderGray },
                    { v: "الأشهر المسجلة", s: sHeaderGray },
                    { v: "نسبة التأخير %", s: sHeaderGray }
                ]);
                rowIdx++;
            };

            if (filterValue === 'all_by_branch') {
                let currentBranch = '';
                let branchIndex = 1;
                
                currentEmployees.forEach(e => {
                    if (e['الفرع'] !== currentBranch) {
                        if (currentBranch !== '') { ws_data.push([]); ws_data.push([]); rowIdx += 2; }
                        currentBranch = e['الفرع'];
                        branchIndex = 1;
                        
                        // Add Branch Header
                        ws_data.push([{ v: currentBranch, s: sHeaderBlue }, null, null, null, null, null, null, null, null]);
                        merges.push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 8 } });
                        rowIdx++;
                        
                        // Add Branch Summary
                        const bStats = currentBranches.find(b => b['الفرع'] === currentBranch);
                        if (bStats) {
                            const summaryText = `موظفي الفرع: ${bStats['إجمالي موظفي الفرع']} | المتأخرين: ${bStats['إجمالي الموظفين المتأخرين']} | نسبة التأخير: ${bStats['نسبة المتأخرين %']}% | حالات التأخير: ${bStats['إجمالي حالات التأخير']} | الدقائق: ${bStats['إجمالي الدقائق']} | الساعات: ${bStats['إجمالي الساعات']}`;
                            ws_data.push([{ v: summaryText, s: { font: { sz: 10, bold: true, color: { rgb: "1E40AF" } }, fill: { fgColor: { rgb: "EFF6FF" } }, alignment: { horizontal: "center", vertical: "center" } } }, null, null, null, null, null, null, null, null]);
                            merges.push({ s: { r: rowIdx, c: 0 }, e: { r: rowIdx, c: 8 } });
                            rowIdx++;
                        }
                        
                        pushHeaderRow();
                    }
                    
                    let rank = branchIndex++;
                    let sRank = rank <= 3 ? sCellRed : sCell;
                    
                    ws_data.push([
                        { v: rank, t: 'n', s: sRank },
                        { v: e['الفرع'], s: sCell },
                        { v: e['اسم الموظف'], s: sCellBold },
                        { v: e['إجمالي حالات التأخير'], t: 'n', s: sCellBlue },
                        { v: e['إجمالي الدقائق'], t: 'n', s: sCell },
                        { v: e['إجمالي الساعات'], t: 'n', s: sCellBold },
                        { v: e['متوسط دقائق التأخير'], t: 'n', s: sCell },
                        { v: e['الأشهر المسجلة'], t: 'n', s: {...sCell, fill: { fgColor: { rgb: "DBEAFE" } } } },
                        { v: e['نسبة التأخير %'] + "%", t: 's', s: sCell }
                    ]);
                    rowIdx++;
                });
            } else {
                pushHeaderRow();
                currentEmployees.forEach((e, i) => {
                    let rank = i + 1;
                    let sRank = (rank <= 5 && filterValue.startsWith('all')) ? sCellRed : sCell;
                    
                    ws_data.push([
                        { v: rank, t: 'n', s: sRank },
                        { v: e['الفرع'], s: sCell },
                        { v: e['اسم الموظف'], s: sCellBold },
                        { v: e['إجمالي حالات التأخير'], t: 'n', s: sCellBlue },
                        { v: e['إجمالي الدقائق'], t: 'n', s: sCell },
                        { v: e['إجمالي الساعات'], t: 'n', s: sCellBold },
                        { v: e['متوسط دقائق التأخير'], t: 'n', s: sCell },
                        { v: e['الأشهر المسجلة'], t: 'n', s: {...sCell, fill: { fgColor: { rgb: "DBEAFE" } } } },
                        { v: e['نسبة التأخير %'] + "%", t: 's', s: sCell }
                    ]);
                    rowIdx++;
                });
            }
            
            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            ws['!merges'] = merges;
            
            // Set Column Widths
            ws['!cols'] = [
                {wch: 6}, {wch: 25}, {wch: 35}, {wch: 15}, {wch: 15}, 
                {wch: 15}, {wch: 18}, {wch: 15}, {wch: 15}
            ];
            
            XLSX.utils.book_append_sheet(wb, ws, "تفاصيل الموظفين");
            
            if (filterValue.startsWith('all')) {
                // Also create Branches Summary Sheet manually
                const ws_branches_data = [];
                ws_branches_data.push([{ v: "ملخص الفروع والدوائر", s: sTitle }, null, null, null, null, null, null, null, null, null]);
                ws_branches_data.push([]);
                
                ws_branches_data.push([
                    { v: "الفرع / الدائرة", s: sHeaderBlue },
                    { v: "حالات التأخير", s: sHeaderBlue },
                    { v: "إجمالي الدقائق", s: sHeaderBlue },
                    { v: "إجمالي الساعات", s: sHeaderBlue },
                    { v: "متوسط التأخير (د)", s: sHeaderBlue },
                    { v: "إجمالي موظفي الفرع", s: sHeaderBlue },
                    { v: "المتأخرون", s: sHeaderBlue },
                    { v: "نسبة المتأخرين %", s: sHeaderBlue },
                    { v: "الموظف الأكثر تأخيراً", s: sHeaderBlue },
                    { v: "اليوم الأكثر تكراراً", s: sHeaderBlue }
                ]);
                
                currentBranches.forEach(b => {
                    const sPct = b['نسبة المتأخرين %'] >= 50 ? sCellRed : sCell;
                    ws_branches_data.push([
                        { v: b['الفرع'], s: sCellBold },
                        { v: b['إجمالي حالات التأخير'], t: 'n', s: sCellBlue },
                        { v: b['إجمالي الدقائق'], t: 'n', s: sCell },
                        { v: b['إجمالي الساعات'], t: 'n', s: sCellBold },
                        { v: b['متوسط دقائق التأخير'], t: 'n', s: sCell },
                        { v: b['إجمالي موظفي الفرع'], t: 'n', s: sCell },
                        { v: b['إجمالي الموظفين المتأخرين'], t: 'n', s: sCell },
                        { v: b['نسبة المتأخرين %'] + "%", t: 's', s: sPct },
                        { v: b['الموظف الأكثر تأخيراً'], s: sCell },
                        { v: b['اليوم الأكثر تكراراً'], s: sCell }
                    ]);
                });
                
                const wsB = XLSX.utils.aoa_to_sheet(ws_branches_data);
                wsB['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }];
                wsB['!cols'] = [{wch: 30}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 18}, {wch: 18}, {wch: 15}, {wch: 18}, {wch: 35}, {wch: 20}];
                XLSX.utils.book_append_sheet(wb, wsB, "ملخص الفروع");
            }
            
            const fileName = `تصدير_التأخيرات_${filterText.replace(/[\\\\/?*\\[\\]:]/g, '')}.xlsx`;
            XLSX.writeFile(wb, fileName);
        }

        function exportToPDF() {
            const btn = event.currentTarget || document.querySelector('button[onclick="exportToPDF()"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin ml-2"></i> جاري التجهيز...';
            btn.disabled = true;
            
            // Wait a brief moment to allow UI to update the button state
            setTimeout(() => {
                const element = document.getElementById('reportContent').cloneNode(true);
                
                // Remove the 'no-print' sections (filter dropdown)
                const noPrint = element.querySelector('.no-print');
                if (noPrint) noPrint.remove();
                
                // Show the PDF header which is normally hidden
                const pdfHeader = element.querySelector('#pdfHeader');
                if (pdfHeader) {
                    pdfHeader.style.display = 'block';
                    const branchFilter = document.getElementById('branchFilter');
                    element.querySelector('#pdfFilterSubtitle').innerText = branchFilter.options[branchFilter.selectedIndex].text;
                }
                
                // Fix tailwind classes that rely on screen width (like grid columns)
                // We force the container to a fixed width so html2canvas renders it as desktop view
                const wrapper = document.createElement('div');
                wrapper.style.width = '1400px'; 
                wrapper.style.padding = '20px';
                wrapper.style.backgroundColor = '#f3f4f6';
                wrapper.dir = 'rtl';
                wrapper.appendChild(element);
                
                const branchFilter = document.getElementById('branchFilter');
                const filterText = branchFilter.options[branchFilter.selectedIndex].text;
                const fileName = `تقرير_التأخيرات_${filterText.replace(/[\\\\/?*\\[\\]:]/g, '')}.pdf`;
    
                const opt = {
                    margin:       10,
                    filename:     fileName,
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  { scale: 2, useCORS: true, windowWidth: 1400 },
                    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' },
                    pagebreak:    { mode: ['css', 'legacy'] }
                };
                
                html2pdf().set(opt).from(wrapper).save().then(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }).catch(err => {
                    console.error("PDF Export Error:", err);
                    alert("حدث خطأ أثناء تصدير الـ PDF. تفاصيل: " + err);
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                });
            }, 100);
        }

        window.onload = renderAll;
    </script>
</body>
</html>
"""
    
    with open("interactive_report_v3.html", "w", encoding="utf-8") as f:
        f.write(html_content)
    
    print("تم إنشاء ملف تقرير_المتابعة_التفاعلي_v3.html بنجاح.")

if __name__ == "__main__":
    generate_html_report()


