import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, HeadingLevel, AlignmentType } from 'docx';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import type { Node, Edge } from '@xyflow/react';

// --- Export to Image & PDF ---
const getA4ExportData = async (): Promise<{ dataUrl: string, orientation: 'p' | 'l', targetWidth: number, targetHeight: number } | null> => {
  const el = document.querySelector('.react-flow__viewport') as HTMLElement;
  if (!el) {
    alert('لم يتم العثور على الرسمة!');
    return null;
  }
  
  try {
    const nodes = document.querySelectorAll('.react-flow__node');
    if (nodes.length === 0) return null;
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      const transform = (n as HTMLElement).style.transform;
      const match = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
      if (match) {
        const x = parseFloat(match[1]);
        const y = parseFloat(match[2]);
        const w = (n as HTMLElement).offsetWidth || 160;
        const h = (n as HTMLElement).offsetHeight || 60;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
      }
    });

    const padding = 60;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    let targetWidth = width;
    let targetHeight = height;
    const A4_RATIO = 1.41421356;

    if (width >= height) {
      if (width / height > A4_RATIO) {
        targetHeight = width / A4_RATIO;
      } else {
        targetWidth = height * A4_RATIO;
      }
    } else {
      if (height / width > A4_RATIO) {
        targetWidth = height / A4_RATIO;
      } else {
        targetHeight = width * A4_RATIO;
      }
    }

    const offsetX = (targetWidth - width) / 2;
    const offsetY = (targetHeight - height) / 2;

    const dataUrl = await toPng(el, { 
      quality: 1, 
      backgroundColor: '#f8f9fa',
      width: targetWidth,
      height: targetHeight,
      style: {
        width: `${targetWidth}px`,
        height: `${targetHeight}px`,
        transform: `translate(${-minX + padding + offsetX}px, ${-minY + padding + offsetY}px) scale(1)`
      },
      filter: (node: any) => {
        if (node?.classList?.contains('hide-on-export')) {
          return false;
        }
        return true;
      }
    });
    
    return { dataUrl, orientation: targetWidth > targetHeight ? 'l' : 'p', targetWidth, targetHeight };
  } catch (err) {
    console.error('Failed to generate export data', err);
    alert('حدث خطأ أثناء معالجة الرسمة');
    return null;
  }
};

export const exportToImage = async (_elementId: string) => {
  const result = await getA4ExportData();
  if (result) {
    saveAs(result.dataUrl, 'org-chart.png');
  }
};

export const exportToPdf = async () => {
  const result = await getA4ExportData();
  if (!result) return;
  
  try {
    const pdf = new jsPDF({
      orientation: result.orientation,
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = result.orientation === 'p' ? 210 : 297;
    const pdfHeight = result.orientation === 'p' ? 297 : 210;
    
    pdf.addImage(result.dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('org-chart.pdf');
  } catch (err) {
    console.error('Failed to export PDF', err);
    alert('حدث خطأ أثناء تصدير PDF');
  }
};

interface ExportNode {
  id: string;
  title: string;
  children: ExportNode[];
}

const buildHierarchy = (nodes: Node[], edges: Edge[]): ExportNode[] => {
  if (nodes.length === 0) return [];
  
  const map = new Map<string, ExportNode>();
  nodes.forEach(n => {
    map.set(n.id, {
      id: n.id,
      title: (n.data?.title as string) || 'بدون مسمى',
      children: []
    });
  });

  const roots: ExportNode[] = [];
  const targetIds = new Set(edges.map(e => e.target));
  
  nodes.forEach(n => {
    if (!targetIds.has(n.id)) {
      roots.push(map.get(n.id)!);
    }
  });

  edges.forEach(e => {
    const parent = map.get(e.source);
    const child = map.get(e.target);
    if (parent && child) {
      parent.children.push(child);
    }
  });

  return roots;
};

// --- Export to Word ---
const walkNodeForWord = (node: ExportNode, level: number = 0): Paragraph[] => {
  const indent = level * 720; // 720 twips = 0.5 inch
  let paragraphs: Paragraph[] = [
    new Paragraph({
      text: node.title,
      heading: level === 0 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
      indent: { left: indent },
      alignment: AlignmentType.RIGHT,
    })
  ];

  if (node.children) {
    node.children.forEach(child => {
      paragraphs = paragraphs.concat(walkNodeForWord(child, level + 1));
    });
  }
  return paragraphs;
};

export const exportToWord = async (nodes: Node[], edges: Edge[]) => {
  const roots = buildHierarchy(nodes, edges);
  let paragraphs: Paragraph[] = [];
  roots.forEach(r => {
    paragraphs = paragraphs.concat(walkNodeForWord(r));
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: "الهيكل التنظيمي",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
        }),
        ...paragraphs
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

const walkNodeForExcel = (node: ExportNode, manager: string = '-', level: number = 0, rows: ExcelRow[] = []) => {
  rows.push({ Level: level, Role: node.title, Manager: manager });

  if (node.children) {
    node.children.forEach(child => walkNodeForExcel(child, node.title, level + 1, rows));
  }
  return rows;
};

export const exportToExcel = (nodes: Node[], edges: Edge[]) => {
  const roots = buildHierarchy(nodes, edges);
  let rows: ExcelRow[] = [];
  roots.forEach(r => {
    rows = walkNodeForExcel(r, '-', 0, rows);
  });
  
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "الهيكل التنظيمي");
  XLSX.writeFile(workbook, "org-chart.xlsx");
};
