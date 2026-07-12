'use client';

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
}

export function PageRenderer({ page, blockStyles, formDefinitions = {} }: PageRendererProps) {
  const blocks = (page.ContentData.ContentBlocks as CmsBlock[]).filter(
    (block) => block.enabled !== false,
  );
  const classNames = (blockStyles ?? {}) as BlockClassNamesMap;

  return (
    <>
      {blocks.map((block, index) => (
        <section key={block.id ?? `${block.type}-${index}`} id={getSectionId(block)}>
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
                    <div dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(body) }} />
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
        </section>
      ))}
    </>
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
