import React from 'react';
import type { MenuPricingBlock } from 'pumpkin-ts-models';
import { menuPricingDefaults, type MenuPricingClassNames } from '../defaults/menuPricing';
import { mergeClasses } from '../utils/mergeClasses';

export interface MenuPricingBlockViewProps {
  block: MenuPricingBlock;
  classNames?: MenuPricingClassNames;
}

export function MenuPricingBlockView({ block, classNames }: MenuPricingBlockViewProps) {
  const cx = mergeClasses(menuPricingDefaults, classNames);
  const { content } = block;
  const layout = content.layout || 'sections';
  const sections = content.sections ?? [];
  const itemLayoutClass = layout === 'cards' ? cx.itemsCards : layout === 'compact' ? cx.itemsCompact : '';

  return (
    <section className={cx.root}>
      <div className={cx.container}>
        {(content.title || content.subtitle) && (
          <div className={cx.header}>
            {content.title && <h2 className={cx.title}>{content.title}</h2>}
            {content.subtitle && <p className={cx.subtitle}>{content.subtitle}</p>}
          </div>
        )}

        {sections.length > 0 ? (
          <div className={cx.sections}>
            {sections.map((section, sectionIndex) => (
              <section key={`${section.title}-${sectionIndex}`} className={cx.section}>
                {(section.title || section.description) && (
                  <div className={cx.sectionHeader}>
                    {section.title && <h3 className={cx.sectionTitle}>{section.title}</h3>}
                    {section.description && <p className={cx.sectionDescription}>{section.description}</p>}
                  </div>
                )}
                <div className={`${cx.items} ${itemLayoutClass}`.trim()}>
                  {(section.items ?? []).map((item, itemIndex) => (
                    <article key={`${item.name}-${itemIndex}`} className={cx.item}>
                      {item.image && <img src={item.image} alt={item.imageAlt || ''} className={cx.itemImage} />}
                      <div className={cx.itemBody}>
                        <div className={cx.itemHeader}>
                          <h4 className={cx.itemTitle}>{item.name}</h4>
                          {content.showPrices && item.price && <span className={cx.itemPrice}>{item.price}</span>}
                        </div>
                        {item.description && <p className={cx.itemDescription}>{item.description}</p>}
                        {item.badge && <span className={cx.badge}>{item.badge}</span>}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className={cx.empty}>Add menu or pricing sections to display this block.</div>
        )}
      </div>
    </section>
  );
}
