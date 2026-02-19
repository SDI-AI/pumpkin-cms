'use client'

import { useState } from 'react'
import { BLOCK_TYPE_INFO, BLOCK_CATEGORIES, type BlockTypeInfo } from './blockDefaults'

interface AddBlockPickerProps {
  onSelect: (blockType: string) => void
  onClose: () => void
}

export default function AddBlockPicker({ onSelect, onClose }: AddBlockPickerProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filtered = BLOCK_TYPE_INFO.filter(b => {
    const matchesSearch = !search || b.label.toLowerCase().includes(search.toLowerCase()) || b.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !activeCategory || b.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const grouped = BLOCK_CATEGORIES.map(cat => ({
    ...cat,
    blocks: filtered.filter(b => b.category === cat.key),
  })).filter(g => g.blocks.length > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Add Content Block</h2>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="px-6 py-3 border-b border-neutral-100 space-y-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search blocks..."
            className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                !activeCategory ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              All
            </button>
            {BLOCK_CATEGORIES.map(cat => (
              <button
                type="button"
                key={cat.key}
                onClick={() => setActiveCategory(activeCategory === cat.key ? null : cat.key)}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                  activeCategory === cat.key ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Block List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {grouped.length === 0 && (
            <p className="text-sm text-neutral-500 text-center py-8">No blocks match your search.</p>
          )}
          {grouped.map(group => (
            <div key={group.key} className="mb-5">
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">{group.label}</h3>
              <div className="grid grid-cols-2 gap-2">
                {group.blocks.map(block => (
                  <BlockOption key={block.type} block={block} onSelect={onSelect} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BlockOption({ block, onSelect }: { block: BlockTypeInfo; onSelect: (type: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(block.type)}
      className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 text-left transition-colors group"
    >
      <span className="text-xl mt-0.5">{block.icon}</span>
      <div className="min-w-0">
        <div className="text-sm font-medium text-neutral-900 group-hover:text-primary-700">{block.label}</div>
        <div className="text-xs text-neutral-500 line-clamp-2">{block.description}</div>
      </div>
    </button>
  )
}
