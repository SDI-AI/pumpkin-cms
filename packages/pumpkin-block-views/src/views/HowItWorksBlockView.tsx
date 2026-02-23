import React from 'react';
import type { HowItWorksBlock } from 'pumpkin-ts-models';
import { howItWorksDefaults, type HowItWorksClassNames } from '../defaults/howItWorks';
import { mergeClasses } from '../utils/mergeClasses';

export interface HowItWorksBlockViewProps {
  block: HowItWorksBlock;
  classNames?: HowItWorksClassNames;
}

export function HowItWorksBlockView({ block, classNames }: HowItWorksBlockViewProps) {
  const cx = mergeClasses(howItWorksDefaults, classNames);
  const { content } = block;

  return (
    <section className={cx.root}>
      <div className={cx.container}>
        {content.title && <h2 className={cx.title}>{content.title}</h2>}
        <div className={cx.steps}>
          {content.steps.map((step, i) => (
            <div key={i} className={cx.step}>
              {step.image ? (
                <img src={step.image} alt={step.alt || ''} className={cx.stepImage} />
              ) : (
                <div className={cx.stepNumber}>{i + 1}</div>
              )}
              <h3 className={cx.stepTitle}>{step.title}</h3>
              {step.text && <p className={cx.stepText}>{step.text}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
