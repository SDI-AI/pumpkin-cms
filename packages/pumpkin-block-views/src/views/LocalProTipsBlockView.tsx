import React from 'react';
import type { LocalProTipsBlock } from 'pumpkin-ts-models';
import { localProTipsDefaults, type LocalProTipsClassNames } from '../defaults/localProTips';
import { mergeClasses } from '../utils/mergeClasses';
import { Icon } from '../components/Icon';

export interface LocalProTipsBlockViewProps {
  block: LocalProTipsBlock;
  classNames?: LocalProTipsClassNames;
}

export function LocalProTipsBlockView({ block, classNames }: LocalProTipsBlockViewProps) {
  const cx = mergeClasses(localProTipsDefaults, classNames);
  const { content } = block;

  return (
    <section className={cx.root}>
      <div className={cx.container}>
        {content.title && <h2 className={cx.title}>{content.title}</h2>}
        <div className={cx.grid}>
          {content.items.map((item, i) => (
            <div key={i} className={cx.item}>
              {item.image ? (
                <img src={item.image} alt={item.title || ''} className={cx.itemImage} />
              ) : item.icon ? (
                <div className={cx.itemIcon}>
                  <Icon name={item.icon} size={28} />
                </div>
              ) : null}
              <div className={cx.itemBody}>
                <h3 className={cx.itemTitle}>{item.title}</h3>
                {item.text && <p className={cx.itemText}>{item.text}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
