import React, { useState } from 'react';
import { Edit2, Plus, Trash2, X, Check } from 'lucide-react';
import type { OrgNode } from './data';

// ==================== COLOR PALETTE ====================
const PALETTE = [
  { key: 'green-dark',   bg: '#2d6a4f', text: '#fff',    label: 'أخضر غامق' },
  { key: 'green-light',  bg: '#52b788', text: '#fff',    label: 'أخضر' },
  { key: 'orange',       bg: '#e76f51', text: '#fff',    label: 'برتقالي' },
  { key: 'orange-light', bg: '#f4a261', text: '#1a1a1a', label: 'برتقالي فاتح' },
  { key: 'blue-light',   bg: '#a8dadc', text: '#1a1a1a', label: 'أزرق' },
  { key: 'peach',        bg: '#ffd7ba', text: '#1a1a1a', label: 'خوخي' },
  { key: 'teal',         bg: '#2a9d8f', text: '#fff',    label: 'أخضر زيتوني' },
];
const getClr = (key: string) => PALETTE.find(c => c.key === key) ?? PALETTE[0];

interface Actions {
  onEdit: (n: OrgNode) => void;
  onAddChild: (id: string) => void;
  onDelete: (id: string) => void;
}

// ==================== NODE BOX ====================
function NodeBox({ node, actions, size = 'md' }: { node: OrgNode; actions: Actions; size?: 'sm' | 'md' | 'lg' }) {
  const clr = getClr(node.color);
  const sizeClass =
    size === 'lg' ? 'min-w-[140px] max-w-[180px] text-[13px] px-4 py-3 font-bold' :
    size === 'sm' ? 'min-w-[90px]  max-w-[120px] text-[10px] px-2 py-1.5'          :
                    'min-w-[110px] max-w-[145px] text-[11px] px-3 py-2';
  return (
    <div dir="rtl"
      style={{ backgroundColor: clr.bg, color: clr.text, borderColor: 'rgba(255,255,255,0.5)' }}
      className={`relative inline-flex group flex-col items-center justify-center ${sizeClass} font-semibold text-center rounded-lg shadow-md border-2 whitespace-pre-wrap leading-snug select-none`}
    >
      {node.title}
      <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 flex gap-0.5 bg-white px-1.5 py-1 rounded-xl shadow-2xl border border-gray-100 z-[100] transition-opacity pointer-events-none group-hover:pointer-events-auto whitespace-nowrap">
        <button onClick={(e) => { e.stopPropagation(); actions.onEdit(node); }} className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition"><Edit2 size={10}/> تعديل</button>
        <div className="w-px bg-gray-200"/>
        <button onClick={(e) => { e.stopPropagation(); actions.onAddChild(node.id); }} className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-green-600 hover:bg-green-50 rounded-lg font-medium transition"><Plus size={10}/> إضافة</button>
        <div className="w-px bg-gray-200"/>
        <button onClick={(e) => { e.stopPropagation(); actions.onDelete(node.id); }} className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-red-600 hover:bg-red-50 rounded-lg font-medium transition"><Trash2 size={10}/> حذف</button>
      </div>
    </div>
  );
}

// ==================== RECURSIVE TREE NODE ====================
function TreeNode({ node, actions }: { node: OrgNode; actions: Actions }) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  return (
    <li className="org-li">
      <NodeBox node={node} actions={actions} />
      {hasChildren && (
        <ul className="org-ul">
          {node.children!.map(child => <TreeNode key={child.id} node={child} actions={actions} />)}
        </ul>
      )}
    </li>
  );
}

// ==================== PRESIDENT SECTION ====================
// Layout:
//                    [root]
//                      | (dashed)
// [leftStaff]---+---[president]---[sibling]
//               |
//               +---[rightStaff0]
//               +---[rightStaff1]
//               |
//              (to children tree)
//
// Uses absolute positioning so president always aligns with children center.
function PresidentSection({ root, president, actions }: {
  root: OrgNode; president: OrgNode; actions: Actions;
}) {
  const ROOT_H    = 58;   // approx lg NodeBox height
  const DASHED_H  = 36;
  const PRES_H    = 58;
  const STAFF_H   = 48;   // approx md NodeBox height
  const STAFF_GAP = 12;
  const HLINE     = 36;   // horizontal branch line px
  const PRES_HALF = 90;   // half of lg NodeBox width (approx 180px/2)

  const leftCount  = president.leftStaff?.length  ?? 0;
  const rightCount = president.rightStaff?.length ?? 0;
  const trunkH     = Math.max(leftCount, rightCount) * (STAFF_H + STAFF_GAP) + 24;
  const totalH     = ROOT_H + DASHED_H + PRES_H + trunkH + 4;

  // Y positions
  const presTop    = ROOT_H + DASHED_H;
  const trunkTop   = presTop + PRES_H;

  return (
    <div style={{ position: 'relative', height: totalH, width: '100%' }}>

      {/* ── CENTER AXIS: root → dashed line → president → trunk ── */}
      <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <NodeBox node={root} actions={actions} size="lg" />
        {/* Dashed line */}
        <div style={{ width: 2, height: DASHED_H, borderLeft: '2px dashed #374151', flexShrink: 0 }} />
        <NodeBox node={president} actions={actions} size="lg" />
        {/* Solid trunk */}
        <div style={{ position: 'relative', width: 2, height: trunkH, background: '#374151', flexShrink: 0 }}>
          {/* Right staff branches off trunk */}
          {president.rightStaff?.map((staff, idx) => (
            <div key={staff.id} style={{ position: 'absolute', top: 12 + idx * (STAFF_H + STAFF_GAP), left: 2, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: HLINE, height: 2, background: '#374151', flexShrink: 0 }} />
              <NodeBox node={staff} actions={actions} />
            </div>
          ))}
        </div>
      </div>

      {/* ── SIBLING (مجلس الجامعة) ── right of president at same Y */}
      {president.leftSibling && (
        <div style={{ position: 'absolute', top: presTop + PRES_H / 2, left: `calc(50% + ${PRES_HALF}px)`, transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 40, height: 2, background: '#374151', flexShrink: 0 }} />
          <NodeBox node={president.leftSibling} actions={actions} size="lg" />
        </div>
      )}

      {/* ── LEFT STAFF: branches off LEFT side of trunk ── */}
      {president.leftStaff?.map((staff, idx) => (
        <div key={staff.id} style={{ position: 'absolute', top: trunkTop + 12 + idx * (STAFF_H + STAFF_GAP), right: `calc(50% + 2px)`, display: 'flex', alignItems: 'center' }}>
          <NodeBox node={staff} actions={actions} />
          <div style={{ width: HLINE, height: 2, background: '#374151', flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export function OrgChart({ data, onUpdate }: { data: OrgNode; onUpdate: (d: OrgNode) => void }) {
  const [editingNode, setEditingNode] = useState<OrgNode | null>(null);

  const walkUpdate = (tree: OrgNode, id: string, patch: Partial<OrgNode>): OrgNode => {
    if (tree.id === id) return { ...tree, ...patch };
    return { ...tree, children: tree.children?.map(c => walkUpdate(c, id, patch)), leftStaff: tree.leftStaff?.map(c => walkUpdate(c, id, patch)), rightStaff: tree.rightStaff?.map(c => walkUpdate(c, id, patch)), leftSibling: tree.leftSibling ? walkUpdate(tree.leftSibling, id, patch) : undefined };
  };
  const walkAdd = (tree: OrgNode, pid: string, node: OrgNode): OrgNode => {
    if (tree.id === pid) return { ...tree, children: [...(tree.children ?? []), node] };
    return { ...tree, children: tree.children?.map(c => walkAdd(c, pid, node)), leftStaff: tree.leftStaff?.map(c => walkAdd(c, pid, node)), rightStaff: tree.rightStaff?.map(c => walkAdd(c, pid, node)), leftSibling: tree.leftSibling ? walkAdd(tree.leftSibling, pid, node) : undefined };
  };
  const walkDelete = (tree: OrgNode, id: string): OrgNode | null => {
    if (tree.id === id) return null;
    return { ...tree, children: tree.children?.map(c => walkDelete(c, id)).filter(Boolean) as OrgNode[], leftStaff: tree.leftStaff?.map(c => walkDelete(c, id)).filter(Boolean) as OrgNode[], rightStaff: tree.rightStaff?.map(c => walkDelete(c, id)).filter(Boolean) as OrgNode[], leftSibling: tree.leftSibling ? (walkDelete(tree.leftSibling, id) ?? undefined) : undefined };
  };

  const handleEdit   = (node: OrgNode) => setEditingNode({ ...node });
  const handleSave   = () => { if (!editingNode) return; onUpdate(walkUpdate(data, editingNode.id, editingNode)); setEditingNode(null); };
  const handleAdd    = (parentId: string) => onUpdate(walkAdd(data, parentId, { id: `n${Date.now()}`, title: 'مسمى جديد', color: 'blue-light' }));
  const handleDelete = (id: string) => {
    if (id === data.id) return alert('لا يمكن حذف العنصر الجذري');
    if (!confirm('هل تريد حذف هذا العنصر وجميع فروعه؟')) return;
    const r = walkDelete(data, id);
    if (r) onUpdate(r);
  };

  const actions: Actions = { onEdit: handleEdit, onAddChild: handleAdd, onDelete: handleDelete };
  const president = data.children?.[0];

  return (
    <div className="w-full overflow-auto bg-[#f8f9fa]">
      <div dir="ltr" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: '48px 80px 80px', minWidth: '100%' }}>

        {president ? (
          <>
            {/* Top section: absolute-positioned for correct alignment */}
            <PresidentSection root={data} president={president} actions={actions} />

            {/* Children CSS tree — centered below the trunk */}
            {(president.children?.length ?? 0) > 0 && (
              <ul className="org-ul">
                {president.children!.map(child => <TreeNode key={child.id} node={child} actions={actions} />)}
              </ul>
            )}
          </>
        ) : (
          <NodeBox node={data} actions={actions} size="lg" />
        )}
      </div>

      {/* ==================== EDIT MODAL ==================== */}
      {editingNode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]" dir="rtl">
          <div className="bg-white rounded-2xl p-6 w-[420px] shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-800">✏️ تعديل العنصر</h2>
              <button onClick={() => setEditingNode(null)} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition"><X size={20}/></button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">المسمى الوظيفي</label>
              <textarea value={editingNode.title} onChange={(e) => setEditingNode({ ...editingNode, title: e.target.value })} className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 resize-none transition" rows={3} autoFocus/>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">اللون</label>
              <div className="flex flex-wrap gap-2.5">
                {PALETTE.map(p => (
                  <button key={p.key} onClick={() => setEditingNode({ ...editingNode, color: p.key })} style={{ backgroundColor: p.bg }} className={`w-10 h-10 rounded-full border-4 transition-all shadow-sm ${editingNode.color === p.key ? 'border-blue-500 scale-110 shadow-md' : 'border-white hover:scale-105'}`} title={p.label}/>
                ))}
              </div>
              <div className="mt-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-center shadow-sm" dir="rtl" style={{ backgroundColor: getClr(editingNode.color).bg, color: getClr(editingNode.color).text }}>
                {editingNode.title || '—'}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingNode(null)} className="px-4 py-2 text-sm border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition font-medium">إلغاء</button>
              <button onClick={handleSave} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2 font-semibold shadow"><Check size={15}/> حفظ التعديلات</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
