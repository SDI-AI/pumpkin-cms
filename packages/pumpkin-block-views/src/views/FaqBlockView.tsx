import React, { useState } from 'react';
import type { FaqBlock } from 'pumpkin-ts-models';
import { faqDefaults, type FaqClassNames } from '../defaults/faq';
import { mergeClasses } from '../utils/mergeClasses';

export interface FaqBlockViewProps {
  block: FaqBlock;
  classNames?: FaqClassNames;
}

export function FaqBlockView({ block, classNames }: FaqBlockViewProps) {
  const cx = mergeClasses(faqDefaults, classNames);
  const { content } = block;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className={cx.root}>
      <div className={cx.container}>
        {(content.title || content.subtitle) && (
          <div className={cx.header}>
            {content.title && <h2 className={cx.title}>{content.title}</h2>}
            {content.subtitle && <p className={cx.subtitle}>{content.subtitle}</p>}
          </div>
        )}
        <div className={cx.list}>
          {content.items.map((item, i) => (
            <div key={i} className={cx.item}>
              <button
                className={cx.question}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
              >
                <span>{item.question}</span>
                <svg
                  className={cx.questionIcon}
                  style={{ transform: openIndex === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </button>
              {openIndex === i && (
                <div className={cx.answer}>{item.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
