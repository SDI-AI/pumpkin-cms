import React from 'react';
import type { CardGridBlock } from 'pumpkin-ts-models';
import { cardGridDefaults, type CardGridClassNames } from '../defaults/cardGrid';
import { mergeClasses } from '../utils/mergeClasses';

export interface CardGridBlockViewProps {
  block: CardGridBlock;
  classNames?: CardGridClassNames;
}

export function CardGridBlockView({ block, classNames }: CardGridBlockViewProps) {
  const cx = mergeClasses(cardGridDefaults, classNames);
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
          {content.cards.map((card, i) => (
            <div key={i} className={cx.card}>
              {card.image && (
                <img src={card.image} alt={card['image-alt'] || card.alt || ''} className={cx.cardImage} />
              )}
              <div className={cx.cardBody}>
                {card.icon && <div className={cx.cardIcon}>{card.icon}</div>}
                <h3 className={cx.cardTitle}>{card.title}</h3>
                {card.description && <p className={cx.cardDescription}>{card.description}</p>}
                {card.link && <a href={card.link} className={cx.cardLink}>Learn more →</a>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
