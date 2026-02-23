import React from 'react';
import type { TestimonialsBlock } from 'pumpkin-ts-models';
import { testimonialsDefaults, type TestimonialsClassNames } from '../defaults/testimonials';
import { mergeClasses } from '../utils/mergeClasses';

export interface TestimonialsBlockViewProps {
  block: TestimonialsBlock;
  classNames?: TestimonialsClassNames;
}

export function TestimonialsBlockView({ block, classNames }: TestimonialsBlockViewProps) {
  const cx = mergeClasses(testimonialsDefaults, classNames);
  const { content } = block;

  return (
    <section className={cx.root}>
      <div className={cx.container}>
        {(content.title || content.subtitle) && (
          <div className={cx.header}>
            {content.title && <h2 className={cx.title}>{content.title}</h2>}
            {content.subtitle && <p className={cx.subtitle}>{content.subtitle}</p>}
          </div>
        )}
        <div className={cx.grid}>
          {content.items.map((item, i) => (
            <div key={i} className={cx.card}>
              <p className={cx.quote}>"{item.quote}"</p>
              {item.rating > 0 && (
                <div className={cx.stars}>
                  {Array.from({ length: 5 }, (_, s) => (
                    <svg
                      key={s}
                      className={s < item.rating ? cx.star : cx.starEmpty}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              )}
              <p className={cx.author}>{item.author}</p>
              {item.eventType && <p className={cx.eventType}>{item.eventType}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
