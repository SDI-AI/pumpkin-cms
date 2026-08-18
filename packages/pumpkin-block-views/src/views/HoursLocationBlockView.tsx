import React from 'react';
import type { HoursLocationBlock } from 'pumpkin-ts-models';
import { hoursLocationDefaults, type HoursLocationClassNames } from '../defaults/hoursLocation';
import { mergeClasses } from '../utils/mergeClasses';

export interface HoursLocationBlockViewProps {
  block: HoursLocationBlock;
  classNames?: HoursLocationClassNames;
}

export function HoursLocationBlockView({ block, classNames }: HoursLocationBlockViewProps) {
  const cx = mergeClasses(hoursLocationDefaults, classNames);
  const { content } = block;
  const mapUrl = safeHttpsUrl(content.mapEmbedUrl);
  const addressLines = content.addressLines ?? [];
  const hours = content.hours ?? [];

  return (
    <section className={cx.root}>
      <div className={cx.container}>
        {(content.title || content.subtitle) && (
          <div className={cx.header}>
            {content.title && <h2 className={cx.title}>{content.title}</h2>}
            {content.subtitle && <p className={cx.subtitle}>{content.subtitle}</p>}
          </div>
        )}

        <div className={cx.content}>
          <div className={cx.details}>
            {addressLines.length > 0 && (
              <div className={cx.detailGroup}>
                <span className={cx.detailLabel}>Address</span>
                <address className={cx.address}>
                  {addressLines.map((line, index) => (
                    <React.Fragment key={`${line}-${index}`}>
                      {line}
                      {index < addressLines.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </address>
              </div>
            )}

            {(content.phone || content.email) && (
              <div className={cx.detailGroup}>
                <span className={cx.detailLabel}>Contact</span>
                {content.phone && <a className={cx.detailValue} href={`tel:${content.phone.replace(/[^\d+]/g, '')}`}>{content.phone}</a>}
                {content.email && <a className={cx.detailValue} href={`mailto:${content.email}`}>{content.email}</a>}
              </div>
            )}

            {hours.length > 0 && (
              <div className={cx.detailGroup}>
                <span className={cx.detailLabel}>Hours</span>
                <dl className={cx.hoursList}>
                  {hours.map((item, index) => (
                    <div key={`${item.label}-${index}`} className={cx.hoursItem}>
                      <dt className={cx.hoursLabel}>{item.label}</dt>
                      <dd className={cx.hoursValue}>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {content.ctaText && content.ctaLink && (
              <div className={cx.actions}>
                <a className={cx.cta} href={content.ctaLink}>{content.ctaText}</a>
              </div>
            )}
          </div>

          {mapUrl && (
            <div className={cx.mapWrapper}>
              <iframe className={cx.mapIframe} src={mapUrl} title={content.title || 'Location map'} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function safeHttpsUrl(value?: string) {
  try {
    const url = new URL((value ?? '').trim());
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}
