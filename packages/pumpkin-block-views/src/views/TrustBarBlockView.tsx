import React from 'react';
import type { TrustBarBlock } from 'pumpkin-ts-models';
import { trustBarDefaults, type TrustBarClassNames } from '../defaults/trustBar';
import { mergeClasses } from '../utils/mergeClasses';

export interface TrustBarBlockViewProps {
  block: TrustBarBlock;
  classNames?: TrustBarClassNames;
}

export function TrustBarBlockView({ block, classNames }: TrustBarBlockViewProps) {
  const cx = mergeClasses(trustBarDefaults, classNames);
  const { content } = block;

  return (
    <section className={cx.root}>
      <div className={cx.container}>
        <div className={cx.grid}>
          {content.items.map((item, i) => (
            <div key={i} className={cx.item}>
              {item.icon && <img src={item.icon} alt={item.alt || ''} className={cx.icon} />}
              <h3 className={cx.itemTitle}>{item.title}</h3>
              {item.text && <p className={cx.itemText}>{item.text}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
