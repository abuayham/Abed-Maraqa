import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, HeadingLevel, AlignmentType } from 'docx';
import * as XLSX from 'xlsx';
import type { Node, Edge } from '@xyflow/react';

// --- Export to Image ---
export const exportToImage = async (_elementId: string) => {
  const el = document.querySelector('.react-flow__viewport') as HTMLElement;
  if (!el) {
    alert('لم يتم العثور على الرسمة!');
    return;
  }
  
  try {
    // 1. Calculate bounding box of all nodes
    const nodes = document.querySelectorAll('.react-flow__node');
    if (nodes.length === 0) return;
    
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

    const dataUrl = await toPng(el, { 
      quality: 1, 
      backgroundColor: '#f8f9fa',
      width,
      height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${-minX + padding}px, ${-minY + padding}px) scale(1)`
      }
    });
    saveAs(dataUrl, 'org-chart.png');
  } catch (err) {
    console.error('Failed to export image', err);
    alert('حدث خطأ أثناء تصدير الصورة');
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
