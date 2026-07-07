'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp, Copy, GripVertical, Plus, Trash2 } from 'lucide-react';
import type { IHtmlBlock } from 'pumpkin-ts-models';
import AddBlockPicker from './AddBlockPicker';
import BlockEditorFields from './BlockEditorFields';
import { BLOCK_TYPE_INFO, createDefaultBlock } from './blockDefaults';

interface ContentBlocksEditorProps {
  blocks: IHtmlBlock[];
  onChange: (blocks: IHtmlBlock[]) => void;
}

export default function ContentBlocksEditor({ blocks, onChange }: ContentBlocksEditorProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [expandedBlock, setExpandedBlock] = useState<number | null>(blocks.length > 0 ? 0 : null);

  const addBlock = (type: string) => {
    const newBlock = createDefaultBlock(type);
    const targetIndex = insertIndex ?? blocks.length;
    const updated = [...blocks];
    updated.splice(targetIndex, 0, newBlock);
    onChange(updated);
    setExpandedBlock(targetIndex);
    setShowPicker(false);
    setInsertIndex(null);
  };

  const openPickerAt = (index: number | null) => {
    setInsertIndex(index);
    setShowPicker(true);
  };

  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, blockIndex) => blockIndex !== index));
    if (expandedBlock === index) setExpandedBlock(null);
    if (expandedBlock !== null && expandedBlock > index) setExpandedBlock(expandedBlock - 1);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= blocks.length) return;

    const updated = [...blocks];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onChange(updated);

    if (expandedBlock === index) setExpandedBlock(target);
    if (expandedBlock === target) setExpandedBlock(index);
  };

  const duplicateBlock = (index: number) => {
    const clone = JSON.parse(JSON.stringify(blocks[index])) as IHtmlBlock;
    const updated = [...blocks];
    updated.splice(index + 1, 0, clone);
    onChange(updated);
    setExpandedBlock(index + 1);
  };

  const updateBlockContent = (index: number, content: Record<string, unknown>) => {
    onChange(blocks.map((block, blockIndex) => blockIndex === index ? { ...block, content } : block));
  };

  return (
    <div>
      {blocks.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
          <p className="text-sm font-medium text-neutral-700">No content blocks yet</p>
          <button
            type="button"
            onClick={() => openPickerAt(null)}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-pumpkin-600 px-4 text-sm font-bold text-white hover:bg-pumpkin-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add Content Block</span>
          </button>
        </div>
      ) : (
        <div>
          <InsertZone onClick={() => openPickerAt(0)} />

          {blocks.map((block, index) => {
            const info = BLOCK_TYPE_INFO.find((item) => item.type === block.type);
            const isExpanded = expandedBlock === index;

            return (
              <div key={`${block.type}-${index}`}>
                <div className={[
                  'overflow-hidden rounded-lg border bg-white transition-colors',
                  isExpanded ? 'border-pumpkin-300 shadow-sm' : 'border-neutral-200',
                ].join(' ')}>
                  <div className="flex items-center gap-2 px-4 py-3">
                    <GripVertical className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden="true" />
                    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-neutral-100 px-2 text-[10px] font-bold text-neutral-700">
                      {info?.icon || block.type.slice(0, 3).toUpperCase()}
                    </span>

                    <button
                      type="button"
                      onClick={() => setExpandedBlock(isExpanded ? null : index)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate text-sm font-bold text-neutral-950">{info?.label || block.type}</span>
                      <span className="text-xs text-neutral-500">Block {index + 1}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <IconButton label="Move up" disabled={index === 0} onClick={() => moveBlock(index, 'up')}>
                        <ChevronUp className="h-4 w-4" aria-hidden="true" />
                      </IconButton>
                      <IconButton label="Move down" disabled={index === blocks.length - 1} onClick={() => moveBlock(index, 'down')}>
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      </IconButton>
                      <IconButton label="Duplicate" onClick={() => duplicateBlock(index)}>
                        <Copy className="h-4 w-4" aria-hidden="true" />
                      </IconButton>
                      <IconButton label="Remove" danger onClick={() => removeBlock(index)}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </IconButton>
                      <IconButton label={isExpanded ? 'Collapse' : 'Expand'} onClick={() => setExpandedBlock(isExpanded ? null : index)}>
                        <ChevronDown className={['h-4 w-4 transition-transform', isExpanded ? 'rotate-180' : ''].join(' ')} aria-hidden="true" />
                      </IconButton>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-neutral-100 px-4 py-4">
                      <BlockEditorFields
                        block={block}
                        onChange={(content) => updateBlockContent(index, content)}
                      />
                    </div>
                  )}
                </div>

                <InsertZone onClick={() => openPickerAt(index + 1)} />
              </div>
            );
          })}
        </div>
      )}

      {showPicker && (
        <AddBlockPicker
          onSelect={addBlock}
          onClose={() => {
            setShowPicker(false);
            setInsertIndex(null);
          }}
        />
      )}
    </div>
  );
}

function IconButton({
  children,
  danger,
  disabled,
  label,
  onClick,
}: {
  children: ReactNode;
  danger?: boolean;
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
      className={[
        'inline-flex h-8 w-8 items-center justify-center rounded-md disabled:cursor-not-allowed disabled:opacity-35',
        danger ? 'text-red-500 hover:bg-red-50 hover:text-red-700' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function InsertZone({ onClick }: { onClick: () => void }) {
  return (
    <div className="group relative h-4">
      <button
        type="button"
        onClick={onClick}
        className="absolute inset-x-0 -top-1 z-10 flex h-6 items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
      >
        <span className="inline-flex items-center gap-1 rounded-full bg-pumpkin-600 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
          <Plus className="h-3 w-3" aria-hidden="true" />
          Add block
        </span>
      </button>
      <div className="absolute inset-x-4 top-1/2 border-t border-dashed border-transparent transition-colors group-hover:border-pumpkin-300" />
    </div>
  );
}
