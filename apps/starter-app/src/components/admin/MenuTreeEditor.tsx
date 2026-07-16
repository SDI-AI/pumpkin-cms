'use client';

import type { ReactNode } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Plus, Trash2 } from 'lucide-react';
import type { MenuItem } from 'pumpkin-ts-models';
import { PageLinkField, type PageLinkOption } from '@/components/admin/PageLinkField';

type MenuPath = number[];

export type MenuPageOption = PageLinkOption;

interface MenuTreeEditorProps {
  menu: MenuItem[];
  onChange: (menu: MenuItem[]) => void;
  pages?: MenuPageOption[];
}

export function MenuTreeEditor({ menu, onChange, pages = [] }: MenuTreeEditorProps) {
  const sortedMenu = sortMenu(menu);

  const update = (next: MenuItem[]) => onChange(normalizeMenuOrders(next));
  const addItem = (parentPath?: MenuPath) => {
    const item = createMenuItem();
    if (!parentPath) return update([...sortedMenu, item]);
    update(updateAtPath(sortedMenu, parentPath, (parent) => ({ ...parent, children: [...sortMenu(parent.children ?? []), item] })));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-neutral-950">Header menu tree</h3>
          <p className="mt-1 text-xs leading-5 text-neutral-500">Order, nest, hide, and link menu items. Changes remain in preview until navigation is saved.</p>
        </div>
        <button type="button" onClick={() => addItem()} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-pumpkin-600 px-3 text-sm font-bold text-white hover:bg-pumpkin-700">
          <Plus className="h-4 w-4" aria-hidden="true" /> Add item
        </button>
      </div>

      {sortedMenu.length === 0 ? (
        <button type="button" onClick={() => addItem()} className="w-full rounded-lg border-2 border-dashed border-neutral-300 p-8 text-sm font-semibold text-neutral-600 hover:border-pumpkin-300 hover:bg-pumpkin-50">Add the first menu item</button>
      ) : sortedMenu.map((item, index) => (
        <MenuNode
          key={`${item.label}-${item.url}-${index}`}
          item={item}
          path={[index]}
          siblingCount={sortedMenu.length}
          pages={pages}
          onAddChild={addItem}
          onUpdate={(path, patch) => update(updateAtPath(sortedMenu, path, (current) => ({ ...current, ...patch })))}
          onRemove={(path) => update(removeAtPath(sortedMenu, path))}
          onMove={(path, direction) => update(moveAtPath(sortedMenu, path, direction))}
          onIndent={(path) => update(indentAtPath(sortedMenu, path))}
          onOutdent={(path) => update(outdentAtPath(sortedMenu, path))}
        />
      ))}
    </div>
  );
}

function MenuNode({ item, path, siblingCount, pages, onAddChild, onIndent, onMove, onOutdent, onRemove, onUpdate }: {
  item: MenuItem;
  path: MenuPath;
  siblingCount: number;
  pages: MenuPageOption[];
  onAddChild: (path: MenuPath) => void;
  onIndent: (path: MenuPath) => void;
  onMove: (path: MenuPath, direction: -1 | 1) => void;
  onOutdent: (path: MenuPath) => void;
  onRemove: (path: MenuPath) => void;
  onUpdate: (path: MenuPath, patch: Partial<MenuItem>) => void;
}) {
  const children = sortMenu(item.children ?? []);
  const index = path.at(-1) ?? 0;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2">
        <MenuField label="Label" value={item.label} onChange={(label) => onUpdate(path, { label })} />
        <PageLinkField label="URL or page" value={item.url} pages={pages} onChange={(url) => onUpdate(path, { url })} />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-neutral-600">Target</span>
          <select value={item.target || '_self'} onChange={(event) => onUpdate(path, { target: event.target.value })} className="mt-1 h-10 w-full rounded-md border border-neutral-300 px-3 text-sm">
            <option value="_self">Same tab</option><option value="_blank">New tab</option>
          </select>
        </label>
        <MenuField label="Icon" value={item.icon || ''} onChange={(icon) => onUpdate(path, { icon })} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <label className="mr-auto inline-flex items-center gap-2 text-sm font-semibold text-neutral-700">
          <input type="checkbox" checked={item.isVisible !== false} onChange={(event) => onUpdate(path, { isVisible: event.target.checked })} className="h-4 w-4 rounded border-neutral-300" /> Visible
        </label>
        <TreeButton label="Move up" disabled={index === 0} onClick={() => onMove(path, -1)}><ChevronUp /></TreeButton>
        <TreeButton label="Move down" disabled={index >= siblingCount - 1} onClick={() => onMove(path, 1)}><ChevronDown /></TreeButton>
        <TreeButton label="Indent under previous item" disabled={index === 0} onClick={() => onIndent(path)}><ChevronRight /></TreeButton>
        <TreeButton label="Outdent" disabled={path.length === 1} onClick={() => onOutdent(path)}><ChevronLeft /></TreeButton>
        <TreeButton label="Add child" onClick={() => onAddChild(path)}><Plus /></TreeButton>
        <TreeButton label="Delete" danger onClick={() => onRemove(path)}><Trash2 /></TreeButton>
      </div>
      {children.length > 0 && (
        <div className="mt-3 space-y-3 border-l-2 border-pumpkin-200 pl-3">
          {children.map((child, childIndex) => (
            <MenuNode key={`${child.label}-${child.url}-${childIndex}`} item={child} path={[...path, childIndex]} siblingCount={children.length} pages={pages} onAddChild={onAddChild} onIndent={onIndent} onMove={onMove} onOutdent={onOutdent} onRemove={onRemove} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}

function MenuField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="text-xs font-bold uppercase tracking-wide text-neutral-600">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-neutral-300 px-3 text-sm outline-none focus:border-pumpkin-500 focus:ring-2 focus:ring-pumpkin-100" /></label>;
}

function TreeButton({ children, danger, disabled, label, onClick }: { children: ReactNode; danger?: boolean; disabled?: boolean; label: string; onClick: () => void }) {
  return <button type="button" title={label} aria-label={label} disabled={disabled} onClick={onClick} className={['inline-flex h-8 w-8 items-center justify-center rounded-md disabled:cursor-not-allowed disabled:opacity-30', danger ? 'text-red-500 hover:bg-red-50' : 'text-neutral-600 hover:bg-neutral-100'].join(' ')}>{children}</button>;
}

function createMenuItem(): MenuItem { return { label: 'New Item', url: '/', target: '_self', icon: '', order: 0, isVisible: true, children: [] }; }
function sortMenu(menu: MenuItem[]): MenuItem[] { return [...menu].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((item) => ({ ...item, children: sortMenu(item.children ?? []) })); }
export function normalizeMenuOrders(menu: MenuItem[]): MenuItem[] { return menu.map((item, order) => ({ ...item, order, target: item.target || '_self', isVisible: item.isVisible !== false, children: normalizeMenuOrders(item.children ?? []) })); }

function updateAtPath(menu: MenuItem[], [index, ...rest]: MenuPath, update: (item: MenuItem) => MenuItem): MenuItem[] {
  return menu.map((item, itemIndex) => itemIndex !== index ? item : rest.length === 0 ? update(item) : { ...item, children: updateAtPath(item.children ?? [], rest, update) });
}
function removeAtPath(menu: MenuItem[], [index, ...rest]: MenuPath): MenuItem[] {
  if (rest.length === 0) return menu.filter((_, itemIndex) => itemIndex !== index);
  return menu.map((item, itemIndex) => itemIndex === index ? { ...item, children: removeAtPath(item.children ?? [], rest) } : item);
}
function moveAtPath(menu: MenuItem[], [index, ...rest]: MenuPath, direction: -1 | 1): MenuItem[] {
  if (rest.length > 0) return menu.map((item, itemIndex) => itemIndex === index ? { ...item, children: moveAtPath(item.children ?? [], rest, direction) } : item);
  const target = index + direction;
  if (target < 0 || target >= menu.length) return menu;
  const next = [...menu]; [next[index], next[target]] = [next[target], next[index]]; return next;
}
function indentAtPath(menu: MenuItem[], [index, ...rest]: MenuPath): MenuItem[] {
  if (rest.length > 0) return menu.map((item, itemIndex) => itemIndex === index ? { ...item, children: indentAtPath(item.children ?? [], rest) } : item);
  if (index === 0) return menu;
  const next = [...menu]; const [item] = next.splice(index, 1); const parent = next[index - 1];
  next[index - 1] = { ...parent, children: [...sortMenu(parent.children ?? []), item] }; return next;
}
function outdentAtPath(menu: MenuItem[], [index, ...rest]: MenuPath): MenuItem[] {
  if (rest.length === 0) return menu;
  if (rest.length > 1) return menu.map((item, itemIndex) => itemIndex === index ? { ...item, children: outdentAtPath(item.children ?? [], rest) } : item);
  const childIndex = rest[0]; const parent = menu[index]; const children = [...(parent.children ?? [])]; const [child] = children.splice(childIndex, 1);
  const next = [...menu]; next[index] = { ...parent, children }; next.splice(index + 1, 0, child); return next;
}
