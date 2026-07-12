'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Plus, Save, Trash2 } from 'lucide-react';
import type { MenuItem, Theme } from 'pumpkin-ts-models';

interface NavigationEditorProps {
  initialTheme: Theme;
  tenantId: string;
}

type MenuPath = number[];

export function NavigationEditor({ initialTheme, tenantId }: NavigationEditorProps) {
  const router = useRouter();
  const [theme, setTheme] = useState(initialTheme);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const sortedMenu = useMemo(() => sortMenu(theme.menu ?? []), [theme.menu]);

  const updateMenu = (menu: MenuItem[]) => {
    setTheme((current) => ({
      ...current,
      menu: normalizeOrders(menu),
      updatedAt: new Date().toISOString(),
    }));
  };

  const addItem = (parentPath?: MenuPath) => {
    const nextItem = createMenuItem();
    if (!parentPath) {
      updateMenu([...sortedMenu, nextItem]);
      return;
    }

    updateMenu(updateAtPath(sortedMenu, parentPath, (item) => ({
      ...item,
      children: [...sortMenu(item.children ?? []), nextItem],
    })));
  };

  const updateItem = (path: MenuPath, patch: Partial<MenuItem>) => {
    updateMenu(updateAtPath(sortedMenu, path, (item) => ({ ...item, ...patch })));
  };

  const removeItem = (path: MenuPath) => {
    updateMenu(removeAtPath(sortedMenu, path));
  };

  const moveItem = (path: MenuPath, direction: -1 | 1) => {
    updateMenu(moveAtPath(sortedMenu, path, direction));
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const payload = {
        ...theme,
        tenantId,
        menu: normalizeOrders(sortedMenu),
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch(`/api/admin/themes/${encodeURIComponent(theme.themeId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(data?.message || 'Unable to save navigation.');
      }

      const saved = await response.json() as Theme;
      setTheme(saved);
      await fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: ['/'] }),
      });
      setMessage('Navigation saved and home/layout cache refreshed.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save navigation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {(message || error) && (
        <p className={[
          'rounded-md border px-3 py-2 text-sm',
          error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700',
        ].join(' ')}>
          {error || message}
        </p>
      )}

      <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-neutral-950">{theme.name || theme.themeId}</h2>
            <p className="mt-1 text-sm text-neutral-600">Active theme menu</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => addItem()}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Item
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-pumpkin-600 px-4 text-sm font-semibold text-white hover:bg-pumpkin-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {saving ? 'Saving...' : 'Save Navigation'}
            </button>
          </div>
        </div>
      </div>

      {sortedMenu.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
          <h2 className="text-base font-bold text-neutral-950">No menu items yet</h2>
          <p className="mt-2 text-sm text-neutral-600">Add the first item to build the public header menu.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedMenu.map((item, index) => (
            <MenuItemEditor
              key={`${item.label}-${item.url}-${index}`}
              item={item}
              path={[index]}
              siblingCount={sortedMenu.length}
              onAddChild={addItem}
              onMove={moveItem}
              onRemove={removeItem}
              onUpdate={updateItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MenuItemEditor({
  item,
  path,
  siblingCount,
  onAddChild,
  onMove,
  onRemove,
  onUpdate,
}: {
  item: MenuItem;
  path: MenuPath;
  siblingCount: number;
  onAddChild: (path: MenuPath) => void;
  onMove: (path: MenuPath, direction: -1 | 1) => void;
  onRemove: (path: MenuPath) => void;
  onUpdate: (path: MenuPath, patch: Partial<MenuItem>) => void;
}) {
  const children = sortMenu(item.children ?? []);
  const index = path[path.length - 1] ?? 0;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[1.2fr_1.4fr_0.7fr_0.7fr_auto] lg:items-end">
        <TextField label="Label" value={item.label} onChange={(value) => onUpdate(path, { label: value })} />
        <TextField label="URL" value={item.url} onChange={(value) => onUpdate(path, { url: value })} />
        <label className="block">
          <span className="text-sm font-semibold text-neutral-800">Target</span>
          <select
            value={item.target || '_self'}
            onChange={(event) => onUpdate(path, { target: event.target.value })}
            className="mt-2 h-10 w-full rounded-md border border-neutral-300 px-3 text-sm"
          >
            <option value="_self">Same tab</option>
            <option value="_blank">New tab</option>
          </select>
        </label>
        <TextField label="Icon" value={item.icon} onChange={(value) => onUpdate(path, { icon: value })} />
        <div className="flex items-center gap-2">
          <IconButton label="Move up" disabled={index === 0} onClick={() => onMove(path, -1)}>
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          </IconButton>
          <IconButton label="Move down" disabled={index >= siblingCount - 1} onClick={() => onMove(path, 1)}>
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </IconButton>
          <IconButton label="Delete" onClick={() => onRemove(path)}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700">
          <input
            type="checkbox"
            checked={item.isVisible !== false}
            onChange={(event) => onUpdate(path, { isVisible: event.target.checked })}
            className="h-4 w-4 rounded border-neutral-300"
          />
          Visible
        </label>
        <button
          type="button"
          onClick={() => onAddChild(path)}
          className="inline-flex h-8 items-center gap-2 rounded-md border border-neutral-300 bg-white px-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Child
        </button>
      </div>

      {children.length > 0 && (
        <div className="mt-4 space-y-3 border-l-2 border-neutral-200 pl-4">
          {children.map((child, childIndex) => (
            <MenuItemEditor
              key={`${child.label}-${child.url}-${childIndex}`}
              item={child}
              path={[...path, childIndex]}
              siblingCount={children.length}
              onAddChild={onAddChild}
              onMove={onMove}
              onRemove={onRemove}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-neutral-800">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-10 w-full rounded-md border border-neutral-300 px-3 text-sm"
      />
    </label>
  );
}

function IconButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function createMenuItem(): MenuItem {
  return {
    label: 'New Item',
    url: '/',
    target: '_self',
    icon: '',
    order: 0,
    isVisible: true,
    children: [],
  };
}

function sortMenu(menu: MenuItem[]): MenuItem[] {
  return [...menu]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((item) => ({ ...item, children: sortMenu(item.children ?? []) }));
}

function normalizeOrders(menu: MenuItem[]): MenuItem[] {
  return menu.map((item, index) => ({
    ...item,
    order: index,
    target: item.target || '_self',
    isVisible: item.isVisible !== false,
    children: normalizeOrders(item.children ?? []),
  }));
}

function updateAtPath(menu: MenuItem[], path: MenuPath, update: (item: MenuItem) => MenuItem): MenuItem[] {
  const [index, ...rest] = path;
  return menu.map((item, itemIndex) => {
    if (itemIndex !== index) {
      return item;
    }

    if (rest.length === 0) {
      return update(item);
    }

    return {
      ...item,
      children: updateAtPath(item.children ?? [], rest, update),
    };
  });
}

function removeAtPath(menu: MenuItem[], path: MenuPath): MenuItem[] {
  const [index, ...rest] = path;
  if (rest.length === 0) {
    return menu.filter((_, itemIndex) => itemIndex !== index);
  }

  return menu.map((item, itemIndex) => itemIndex === index
    ? { ...item, children: removeAtPath(item.children ?? [], rest) }
    : item);
}

function moveAtPath(menu: MenuItem[], path: MenuPath, direction: -1 | 1): MenuItem[] {
  const [index, ...rest] = path;
  if (rest.length === 0) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= menu.length) {
      return menu;
    }

    const next = [...menu];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    return next;
  }

  return menu.map((item, itemIndex) => itemIndex === index
    ? { ...item, children: moveAtPath(item.children ?? [], rest, direction) }
    : item);
}
