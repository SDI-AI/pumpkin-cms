import React from 'react';
import type { EventPackagesBlock } from 'pumpkin-ts-models';
import { eventPackagesDefaults, type EventPackagesClassNames } from '../defaults/eventPackages';
import { mergeClasses } from '../utils/mergeClasses';

export interface EventPackagesBlockViewProps {
  block: EventPackagesBlock;
  classNames?: EventPackagesClassNames;
}

export function EventPackagesBlockView({ block, classNames }: EventPackagesBlockViewProps) {
  const cx = mergeClasses(eventPackagesDefaults, classNames);
  const { content } = block;
  const packages = content.packages ?? [];
  const layoutClass = content.layout === 'compact' ? cx.compact : cx.grid;

  return (
    <section className={cx.root}>
      <div className={cx.container}>
        {(content.title || content.subtitle) && (
          <div className={cx.header}>
            {content.title && <h2 className={cx.title}>{content.title}</h2>}
            {content.subtitle && <p className={cx.subtitle}>{content.subtitle}</p>}
          </div>
        )}

        {packages.length > 0 ? (
          <div className={layoutClass}>
            {packages.map((pkg, index) => (
              <article key={`${pkg.name}-${index}`} className={`${cx.card} ${pkg.highlighted ? cx.cardHighlighted : ''}`.trim()}>
                {pkg.image && <img src={pkg.image} alt={pkg.imageAlt || ''} className={cx.image} />}
                <div className={cx.body}>
                  <h3 className={cx.packageName}>{pkg.name}</h3>
                  {pkg.description && <p className={cx.description}>{pkg.description}</p>}
                  {pkg.price && <p className={cx.price}>{pkg.price}</p>}
                  {pkg.priceNote && <p className={cx.priceNote}>{pkg.priceNote}</p>}
                  {(pkg.features ?? []).length > 0 && (
                    <ul className={cx.features}>
                      {pkg.features.map((feature, featureIndex) => (
                        <li key={`${feature}-${featureIndex}`} className={cx.feature}>
                          <span aria-hidden="true">-</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {pkg.ctaText && pkg.ctaLink && <a className={cx.cta} href={pkg.ctaLink}>{pkg.ctaText}</a>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={cx.empty}>Add packages to display this block.</div>
        )}
      </div>
    </section>
  );
}
