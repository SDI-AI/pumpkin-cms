import React from 'react';
import type { SecondaryCtaBlock } from 'pumpkin-ts-models';
import { secondaryCtaDefaults, type SecondaryCtaClassNames } from '../defaults/secondaryCta';
import { mergeClasses } from '../utils/mergeClasses';

export interface SecondaryCtaBlockViewProps {
  block: SecondaryCtaBlock;
  classNames?: SecondaryCtaClassNames;
}

export function SecondaryCtaBlockView({ block, classNames }: SecondaryCtaBlockViewProps) {
  const cx = mergeClasses(secondaryCtaDefaults, classNames);
  const { content } = block;

  return (
    <section className={cx.root}>
      <div className={cx.container}>
        <h2 className={cx.title}>{content.title}</h2>
        {content.description && <p className={cx.description}>{content.description}</p>}
        {content.buttonText && (
          <a href={content.buttonLink} className={cx.button}>{content.buttonText}</a>
        )}
      </div>
    </section>
  );
}
