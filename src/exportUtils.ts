import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, HeadingLevel, AlignmentType } from 'docx';
import * as XLSX from 'xlsx';
import type { OrgNode } from './data';

// --- Export to Image ---
export const exportToImage = async (elementId: string) => {
  const el = document.getElementById(elementId);
  if (!el) return;
  try {
    const dataUrl = await toPng(el, { quality: 1, backgroundColor: '#f8f9fa' });
    saveAs(dataUrl, 'org-chart.png');
  } catch (err) {
    console.error('Failed to export image', err);
    alert('حدث خطأ أثناء تصدير الصورة');
  }
};

// --- Export to Word ---
const walkNodeForWord = (node: OrgNode, level: number = 0): Paragraph[] => {
  const indent = level * 720; // 720 twips = 0.5 inch
  let paragraphs: Paragraph[] = [
    new Paragraph({
      text: node.title,
      heading: level === 0 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
      indent: { left: indent },
      alignment: AlignmentType.RIGHT,
    })
  ];

  if (node.leftSibling) {
    paragraphs = paragraphs.concat(walkNodeForWord(node.leftSibling, level));
  }
  if (node.leftStaff) {
    node.leftStaff.forEach(staff => {
      paragraphs = paragraphs.concat(walkNodeForWord(staff, level + 1));
    });
  }
  if (node.rightStaff) {
    node.rightStaff.forEach(staff => {
      paragraphs = paragraphs.concat(walkNodeForWord(staff, level + 1));
    });
  }
  if (node.children) {
    node.children.forEach(child => {
      paragraphs = paragraphs.concat(walkNodeForWord(child, level + 1));
    });
  }
  return paragraphs;
};

export const exportToWord = async (data: OrgNode) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: "الهيكل التنظيمي",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
        }),
        ...walkNodeForWord(data)
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, 'org-chart.docx');
};

// --- Export to Excel ---
interface ExcelRow {
  Level: number;
  Role: string;
  Manager: string;
}

const walkNodeForExcel = (node: OrgNode, manager: string = '-', level: number = 0, rows: ExcelRow[] = []) => {
  rows.push({ Level: level, Role: node.title, Manager: manager });

  if (node.leftSibling) walkNodeForExcel(node.leftSibling, manager, level, rows);
  
  if (node.leftStaff) {
    node.leftStaff.forEach(staff => walkNodeForExcel(staff, node.title, level + 1, rows));
  }
  if (node.rightStaff) {
    node.rightStaff.forEach(staff => walkNodeForExcel(staff, node.title, level + 1, rows));
  }
  if (node.children) {
    node.children.forEach(child => walkNodeForExcel(child, node.title, level + 1, rows));
  }
  return rows;
};

export const exportToExcel = (data: OrgNode) => {
  const rows = walkNodeForExcel(data);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "الهيكل التنظيمي");
  XLSX.writeFile(workbook, "org-chart.xlsx");
};
