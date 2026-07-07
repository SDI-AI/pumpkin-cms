'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { BLOCK_CATEGORIES, BLOCK_TYPE_INFO, type BlockTypeInfo } from './blockDefaults';

interface AddBlockPickerProps {
  onSelect: (blockType: string) => void;
  onClose: () => void;
}

export default function AddBlockPicker({ onSelect, onClose }: AddBlockPickerProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = BLOCK_TYPE_INFO.filter((block) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query
      || block.label.toLowerCase().includes(query)
      || block.description.toLowerCase().includes(query);
    const matchesCategory = !activeCategory || block.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const grouped = BLOCK_CATEGORIES.map((category) => ({
    ...category,
    blocks: filtered.filter((block) => block.category === category.key),
  })).filter((group) => group.blocks.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/45 p-4">
      <div className="flex max-h-[82vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-base font-bold text-neutral-950">Add Content Block</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
            aria-label="Close block picker"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 border-b border-neutral-100 px-5 py-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search blocks"
              className="h-10 w-full rounded-md border border-neutral-300 pl-9 pr-3 text-sm outline-none focus:border-pumpkin-500 focus:ring-2 focus:ring-pumpkin-100"
              autoFocus
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={[
                'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                !activeCategory ? 'bg-pumpkin-100 text-pumpkin-800' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
              ].join(' ')}
            >
              All
            </button>
            {BLOCK_CATEGORIES.map((category) => (
              <button
                type="button"
                key={category.key}
                onClick={() => setActiveCategory(activeCategory === category.key ? null : category.key)}
                className={[
                  'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                  activeCategory === category.key ? 'bg-pumpkin-100 text-pumpkin-800' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
                ].join(' ')}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {grouped.length === 0 && (
            <p className="py-10 text-center text-sm text-neutral-500">No blocks match your search.</p>
          )}

          {grouped.map((group) => (
            <div key={group.key} className="mb-5">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">{group.label}</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.blocks.map((block) => (
                  <BlockOption key={block.type} block={block} onSelect={onSelect} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BlockOption({ block, onSelect }: { block: BlockTypeInfo; onSelect: (type: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(block.type)}
      className="flex min-h-24 items-start gap-3 rounded-lg border border-neutral-200 p-3 text-left transition-colors hover:border-pumpkin-300 hover:bg-pumpkin-50"
    >
      <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-md bg-neutral-100 px-2 text-[11px] font-bold text-neutral-700">
        {block.icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-neutral-950">{block.label}</span>
        <span className="mt-1 line-clamp-2 block text-xs leading-5 text-neutral-600">{block.description}</span>
      </span>
    </button>
  );
}
