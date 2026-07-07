'use client';

import React from 'react';
import type { IHtmlBlock } from 'pumpkin-ts-models';
import type { Page, BlockStyleMap } from 'pumpkin-ts-models';
import type { BlockClassNamesMap } from 'pumpkin-block-views';
import { BlockViewRenderer } from 'pumpkin-block-views';

/** Extended block shape that includes optional metadata fields from the CMS. */
interface CmsBlock extends IHtmlBlock {
  id?: string;
  name?: string;
  enabled?: boolean;
}

interface PageRendererProps {
  page: Page;
  /** Per-block-type classNames from the active theme's blockStyles. */
  blockStyles?: BlockStyleMap;
}

/**
 * Renders all enabled content blocks from a Page using BlockViewRenderer
 * with the active theme's block styles applied.
 */
export function PageRenderer({ page, blockStyles }: PageRendererProps) {
  const blocks = (page.ContentData.ContentBlocks as CmsBlock[]).filter(
    (b) => b.enabled !== false
  );

  // Cast BlockStyleMap (Record<string, Record<string, string>>) to BlockClassNamesMap.
  // Both use the same shape: { BlockType: { slot: classString } }.
  const classNames = (blockStyles ?? {}) as BlockClassNamesMap;

  const handleContactSubmit = (formData: Record<string, string>) => {
    console.log('[sample-app] Contact form submitted:', formData);
    alert('Thanks for reaching out! (This is a demo — no data was sent.)');
  };

  const renderBlogBody = (body: string) => {
    return <div dangerouslySetInnerHTML={{ __html: body }} />;
  };

  return (
    <>
      {blocks.map((block, idx) => (
        <section key={block.id ?? `block-${idx}`} id={getSectionId(block)}>
          <BlockViewRenderer
            block={block}
            classNames={classNames}
            overrides={{
              Contact: { onSubmit: handleContactSubmit },
              Blog: { renderBody: renderBlogBody },
            }}
            fallback={
              <div className="max-w-3xl mx-auto px-8 py-12 text-center text-neutral-400">
                <p>Unknown block type: {block.type}</p>
              </div>
            }
          />
        </section>
      ))}
    </>
  );
}

/**
 * Map block types to HTML id attributes for anchor navigation.
 */
function getSectionId(block: CmsBlock): string {
  const map: Record<string, string> = {
    Hero: 'hero',
    CardGrid: 'features',
    HowItWorks: 'how-it-works',
    FAQ: 'faq',
    Blog: 'blog',
    Contact: 'contact',
    Testimonials: 'testimonials',
    Gallery: 'gallery',
  };
  return map[block.type] || block.id || block.type.toLowerCase();
}
