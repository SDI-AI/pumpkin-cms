'use client'

import { useState } from 'react'
import type { IHtmlBlock } from 'pumpkin-ts-models'
import AddBlockPicker from './AddBlockPicker'
import BlockEditorFields from './BlockEditorFields'
import { createDefaultBlock, BLOCK_TYPE_INFO } from './blockDefaults'

interface ContentBlocksEditorProps {
  blocks: IHtmlBlock[]
  onChange: (blocks: IHtmlBlock[]) => void
}

export default function ContentBlocksEditor({ blocks, onChange }: ContentBlocksEditorProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [insertIndex, setInsertIndex] = useState<number | null>(null)
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null)

  const addBlock = (type: string) => {
    const newBlock = createDefaultBlock(type)
    const idx = insertIndex !== null ? insertIndex : blocks.length
    const updated = [...blocks]
    updated.splice(idx, 0, newBlock)
    onChange(updated)
    setExpandedBlock(idx)
    setShowPicker(false)
    setInsertIndex(null)
  }

  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index))
    if (expandedBlock === index) setExpandedBlock(null)
    else if (expandedBlock !== null && expandedBlock > index) setExpandedBlock(expandedBlock - 1)
  }

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= blocks.length) return
    const updated = [...blocks]
    ;[updated[index], updated[target]] = [updated[target], updated[index]]
    onChange(updated)
    if (expandedBlock === index) setExpandedBlock(target)
    else if (expandedBlock === target) setExpandedBlock(index)
  }

  const duplicateBlock = (index: number) => {
    const clone = JSON.parse(JSON.stringify(blocks[index]))
    const updated = [...blocks]
    updated.splice(index + 1, 0, clone)
    onChange(updated)
  }

  const updateBlockContent = (index: number, content: Record<string, any>) => {
    const updated = blocks.map((b, i) => i === index ? { ...b, content } : b)
    onChange(updated)
  }

  const getBlockInfo = (type: string) => BLOCK_TYPE_INFO.find(b => b.type === type)

  const openPickerAt = (index: number) => {
    setInsertIndex(index)
    setShowPicker(true)
  }

  return (
    <div>
      {/* Block List */}
      {blocks.length === 0 ? (
        <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center">
          <p className="text-sm text-neutral-500 mb-3">No content blocks yet</p>
          <button
            type="button"
            onClick={() => { setInsertIndex(null); setShowPicker(true) }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Content Block
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Insert-before zone for first position */}
          <InsertZone onClick={() => openPickerAt(0)} />

          {blocks.map((block, index) => {
            const info = getBlockInfo(block.type)
            const isExpanded = expandedBlock === index

            return (
              <div key={index}>
                <div className={`border rounded-lg transition-colors ${isExpanded ? 'border-primary-300 bg-white shadow-sm' : 'border-neutral-200 bg-white'}`}>
                  {/* Block Header */}
                  <div className="flex items-center gap-2 px-4 py-3">
                    {/* Drag handle (visual only for now) */}
                    <span className="text-neutral-300 cursor-grab select-none" title="Drag to reorder">?</span>

                    {/* Block type badge */}
                    <span className="text-lg">{info?.icon || '??'}</span>
                    <button
                      type="button"
                      onClick={() => setExpandedBlock(isExpanded ? null : index)}
                      className="flex-1 text-left"
                    >
                      <span className="text-sm font-medium text-neutral-900">{info?.label || block.type}</span>
                      <span className="ml-2 text-xs text-neutral-400">#{index + 1}</span>
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30" title="Move up">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                      </button>
                      <button type="button" onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1} className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30" title="Move down">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      <button type="button" onClick={() => duplicateBlock(index)} className="p-1 text-neutral-400 hover:text-neutral-600" title="Duplicate">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </button>
                      <button type="button" onClick={() => removeBlock(index)} className="p-1 text-red-400 hover:text-red-600" title="Remove">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                      <button type="button" onClick={() => setExpandedBlock(isExpanded ? null : index)} className="p-1 text-neutral-400 hover:text-neutral-600">
                        <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Editor */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-neutral-100">
                      <BlockEditorFields
                        block={block}
                        onChange={(content) => updateBlockContent(index, content)}
                      />
                    </div>
                  )}
                </div>

                {/* Insert-after zone */}
                <InsertZone onClick={() => openPickerAt(index + 1)} />
              </div>
            )
          })}
        </div>
      )}

      {/* Picker Modal */}
      {showPicker && (
        <AddBlockPicker
          onSelect={addBlock}
          onClose={() => { setShowPicker(false); setInsertIndex(null) }}
        />
      )}
    </div>
  )
}

function InsertZone({ onClick }: { onClick: () => void }) {
  return (
    <div className="relative h-3 group">
      <button
        type="button"
        onClick={onClick}
        className="absolute inset-x-0 -top-1 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <span className="flex items-center gap-1 px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full shadow-sm">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add block
        </span>
      </button>
      <div className="absolute inset-x-4 top-1/2 border-t border-dashed border-transparent group-hover:border-primary-300 transition-colors" />
    </div>
  )
}
