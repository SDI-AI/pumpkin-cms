import React from 'react';
import type { ServiceAreaMapBlock } from 'pumpkin-ts-models';
import { serviceAreaMapDefaults, type ServiceAreaMapClassNames } from '../defaults/serviceAreaMap';
import { mergeClasses } from '../utils/mergeClasses';

export interface ServiceAreaMapBlockViewProps {
  block: ServiceAreaMapBlock;
  classNames?: ServiceAreaMapClassNames;
}

export function ServiceAreaMapBlockView({ block, classNames }: ServiceAreaMapBlockViewProps) {
  const cx = mergeClasses(serviceAreaMapDefaults, classNames);
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
        {content.mapEmbedUrl && (
          <div className={cx.mapWrapper}>
            <iframe
              src={content.mapEmbedUrl}
              className={cx.mapIframe}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={content.title || 'Service Area Map'}
              allowFullScreen
            />
          </div>
        )}
        {(content.neighborhoods?.length || content.zipCodes?.length || content.nearbyCities?.length) && (
          <div className={cx.lists}>
            {content.neighborhoods?.length > 0 && (
              <div className={cx.listSection}>
                <h3 className={cx.listTitle}>Neighborhoods</h3>
                <div className={cx.listItems}>
                  {content.neighborhoods.map((n, i) => (
                    <span key={i} className={cx.listItem}>{n}</span>
                  ))}
                </div>
              </div>
            )}
            {content.zipCodes?.length > 0 && (
              <div className={cx.listSection}>
                <h3 className={cx.listTitle}>Zip Codes</h3>
                <div className={cx.listItems}>
                  {content.zipCodes.map((z, i) => (
                    <span key={i} className={cx.listItem}>{z}</span>
                  ))}
                </div>
              </div>
            )}
            {content.nearbyCities?.length > 0 && (
              <div className={cx.listSection}>
                <h3 className={cx.listTitle}>Nearby Cities</h3>
                <div className={cx.listItems}>
                  {content.nearbyCities.map((c, i) => (
                    <span key={i} className={cx.listItem}>{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
