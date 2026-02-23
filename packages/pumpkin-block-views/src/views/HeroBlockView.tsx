import React from 'react';
import type { HeroBlock } from 'pumpkin-ts-models';
import { heroDefaults, type HeroClassNames } from '../defaults/hero';
import { mergeClasses } from '../utils/mergeClasses';

export interface HeroBlockViewProps {
  block: HeroBlock;
  classNames?: HeroClassNames;
}

export function HeroBlockView({ block, classNames }: HeroBlockViewProps) {
  const cx = mergeClasses(heroDefaults, classNames);
  const { content } = block;

  return (
    <section
      className={cx.root}
      style={content.backgroundImage ? { backgroundImage: `url(${content.backgroundImage})` } : undefined}
    >
      {content.backgroundImage && <div className={cx.overlay} aria-hidden="true" />}
      <div className={cx.container}>
        <h1 className={cx.headline}>{content.headline}</h1>
        {content.subheadline && <p className={cx.subheadline}>{content.subheadline}</p>}
        {content.mainImage && (
          <img src={content.mainImage} alt={content.mainImageAltText || ''} className={cx.mainImage} />
        )}
        {content.buttonText && (
          <a href={content.buttonLink} className={cx.button}>{content.buttonText}</a>
        )}
      </div>
    </section>
  );
}
