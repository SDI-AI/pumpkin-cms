'use client';

import { Copy, Pencil, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { BlockClassNamesMap } from 'pumpkin-block-views';
import { BlockViewRenderer } from 'pumpkin-block-views';
import type { BlockStyleMap, ContactBlock, FormDefinition, IHtmlBlock, Page } from 'pumpkin-ts-models';
import { ContactFormBlock } from '@/components/ContactFormBlock';

interface CmsBlock extends IHtmlBlock {
  id?: string;
  enabled?: boolean;
}

interface PageRendererProps {
  page: Page;
  blockStyles?: BlockStyleMap;
  formDefinitions?: Record<string, FormDefinition>;
  editor?: PageRendererEditorOptions;
}

export interface PageRendererEditorOptions {
  selectedBlockId?: string | null;
  onSelectBlock: (blockId: string) => void;
  onBlockAction: (action: 'move-up' | 'move-down' | 'duplicate' | 'delete', blockId: string) => void;
  onInsertBlock: (index: number) => void;
}

export function PageRenderer({ page, blockStyles, formDefinitions = {}, editor }: PageRendererProps) {
  const blocks = (page.ContentData.ContentBlocks as CmsBlock[]).filter(
    (block) => block.enabled !== false,
  );
  const classNames = (blockStyles ?? {}) as BlockClassNamesMap;

  return (
    <>
      {editor && blocks.length === 0 && (
        <div className="flex min-h-56 items-center justify-center border-2 border-dashed border-orange-300 bg-orange-50/60 p-8">
          <button type="button" onClick={() => editor.onInsertBlock(0)} className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-orange-700">
            <Plus className="h-4 w-4" aria-hidden="true" /> Add the first block
          </button>
        </div>
      )}
      {blocks.map((block, index) => {
        const blockId = block.id ?? `${block.type}-${index}`;
        const selected = editor?.selectedBlockId === blockId;

        return (
        <div key={blockId} className={editor ? 'visual-editor-block-group' : undefined}>
          {editor && <InsertBlockControl onClick={() => editor.onInsertBlock(index)} />}
          <section
            id={getSectionId(block)}
            className={editor ? 'visual-editor-block' : undefined}
            data-block-id={blockId}
            data-selected={selected ? 'true' : 'false'}
            onClick={editor ? () => editor.onSelectBlock(blockId) : undefined}
          >
          {block.type === 'Contact' ? (
            <ContactFormBlock
              block={block as ContactBlock}
              classNames={classNames.Contact}
              formDefinition={getFormDefinition(block, formDefinitions)}
              pageSlug={page.pageSlug}
            />
          ) : (
            <BlockViewRenderer
              block={block}
              classNames={classNames}
              overrides={{
                Blog: {
                  renderBody: (body) => (
                    <div className="cms-rich-text" dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(body) }} />
                  ),
                },
                Form: {
                  formDefinition: getFormDefinition(block, formDefinitions),
                  pageSlug: page.pageSlug,
                  onSubmit: submitForm,
                },
              }}
              fallback={
                <div className="mx-auto max-w-3xl px-8 py-12 text-center text-sm text-neutral-500">
                  Unknown block type: {block.type}
                </div>
              }
            />
          )}
            {editor && (
              <>
                <div className="visual-editor-block__outline" aria-hidden="true" />
                <div className="visual-editor-block__toolbar" onClick={(event) => event.stopPropagation()}>
                  <span>{block.type}</span>
                  <EditorIcon label="Edit" onClick={() => editor.onSelectBlock(blockId)}><Pencil /></EditorIcon>
                  <EditorIcon label="Move up" disabled={index === 0} onClick={() => editor.onBlockAction('move-up', blockId)}><ChevronUp /></EditorIcon>
                  <EditorIcon label="Move down" disabled={index === blocks.length - 1} onClick={() => editor.onBlockAction('move-down', blockId)}><ChevronDown /></EditorIcon>
                  <EditorIcon label="Duplicate" onClick={() => editor.onBlockAction('duplicate', blockId)}><Copy /></EditorIcon>
                  <EditorIcon label="Delete" danger onClick={() => editor.onBlockAction('delete', blockId)}><Trash2 /></EditorIcon>
                </div>
              </>
            )}
          </section>
          {editor && index === blocks.length - 1 && <InsertBlockControl onClick={() => editor.onInsertBlock(blocks.length)} />}
        </div>
      )})}
    </>
  );
}

function InsertBlockControl({ onClick }: { onClick: () => void }) {
  return (
    <div className="visual-editor-insert">
      <button type="button" onClick={onClick}><Plus aria-hidden="true" /> Add block</button>
    </div>
  );
}

function EditorIcon({ children, danger, disabled, label, onClick }: { children: React.ReactNode; danger?: boolean; disabled?: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} data-danger={danger ? 'true' : 'false'} onClick={onClick}>
      {children}
    </button>
  );
}

function sanitizeCmsHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(["']).*?\1/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/\s(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, '')
    .replace(/\s(href|src)\s*=\s*javascript:[^\s>]+/gi, '')
    .replace(/\sstyle\s*=\s*(["']).*?\1/gi, '');
}

function getFormDefinition(block: CmsBlock, formDefinitions: Record<string, FormDefinition>) {
  const formType = (block.content as { formType?: string } | undefined)?.formType;
  if (!formType) return undefined;

  return formDefinitions[formType.trim().toLowerCase()];
}

function getSectionId(block: CmsBlock) {
  const ids: Record<string, string> = {
    Hero: 'hero',
    CardGrid: 'features',
    HowItWorks: 'how-it-works',
    FAQ: 'faq',
    HubSpokes: 'related-pages',
    Blog: 'blog',
    Contact: 'contact',
    Form: 'contact',
    Testimonials: 'testimonials',
    Gallery: 'gallery',
  };

  return ids[block.type] ?? block.id ?? block.type.toLowerCase();
}

async function submitForm(formType: string, formData: Record<string, string>, pageSlug?: string) {
  const response = await fetch(`/api/forms/submit/${encodeURIComponent(formType.trim().toLowerCase())}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...formData,
      pageSlug,
    }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}

async function getErrorMessage(response: Response) {
  const text = await response.text();
  try {
    const data = JSON.parse(text) as { message?: string; detail?: string; title?: string };
    return data.message || data.detail || data.title || text || 'The form could not be submitted.';
  } catch {
    return text || 'The form could not be submitted.';
  }
}
