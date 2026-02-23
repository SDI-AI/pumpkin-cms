import React from 'react';
import type { PrimaryCtaBlock } from 'pumpkin-ts-models';
import { primaryCtaDefaults, type PrimaryCtaClassNames } from '../defaults/primaryCta';
import { mergeClasses } from '../utils/mergeClasses';

export interface PrimaryCtaBlockViewProps {
  block: PrimaryCtaBlock;
  classNames?: PrimaryCtaClassNames;
}

export function PrimaryCtaBlockView({ block, classNames }: PrimaryCtaBlockViewProps) {
  const cx = mergeClasses(primaryCtaDefaults, classNames);
  const { content } = block;

  return (
    <section
      className={cx.root}
      style={content.backgroundImage ? { backgroundImage: `url(${content.backgroundImage})` } : undefined}
    >
      {content.backgroundImage && <div className={cx.overlay} aria-hidden="true" />}
      <div className={cx.container}>
        <div className={cx.textWrapper}>
          <h2 className={cx.title}>{content.title}</h2>
          {content.description && <p className={cx.description}>{content.description}</p>}
          {content.buttonText && (
            <a href={content.buttonLink} className={cx.button}>{content.buttonText}</a>
          )}
          {content.secondaryLinkText && (
            <div className={cx.secondaryWrapper}>
              {content.secondaryText && <span>{content.secondaryText} </span>}
              <a href={content.secondaryLink} className={cx.secondaryLink}>{content.secondaryLinkText}</a>
            </div>
          )}
        </div>
        {content.mainImage && (
          <img src={content.mainImage} alt={content.alt || ''} className={cx.mainImage} />
        )}
      </div>
    </section>
  );
}
