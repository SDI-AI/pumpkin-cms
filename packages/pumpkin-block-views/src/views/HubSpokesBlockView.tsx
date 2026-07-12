import React from 'react';
import type { HubSpokeLink, HubSpokesBlock } from 'pumpkin-ts-models';
import { hubSpokesDefaults, type HubSpokesClassNames } from '../defaults/hubSpokes';
import { mergeClasses } from '../utils/mergeClasses';

export interface HubSpokesBlockViewProps {
  block: HubSpokesBlock;
  classNames?: HubSpokesClassNames;
}

export function HubSpokesBlockView({ block, classNames }: HubSpokesBlockViewProps) {
  const cx = mergeClasses(hubSpokesDefaults, classNames);
  const { content } = block;
  const spokes = content.spokes ?? [];
  const layout = content.layout || 'cards';

  return (
    <section className={cx.root}>
      <div className={cx.container}>
        {(content.title || content.subtitle) && (
          <div className={cx.header}>
            {content.title && <h2 className={cx.title}>{content.title}</h2>}
            {content.subtitle && <p className={cx.subtitle}>{content.subtitle}</p>}
          </div>
        )}

        {spokes.length === 0 ? (
          <div className={cx.empty}>No spoke pages are published for this hub yet.</div>
        ) : layout === 'list' ? (
          <div className={cx.list}>
            {spokes.map((spoke) => (
              <SpokeListItem key={spoke.url} spoke={spoke} content={content} classNames={cx} />
            ))}
          </div>
        ) : layout === 'compact' ? (
          <div className="flex flex-wrap gap-2">
            {spokes.map((spoke) => (
              <a key={spoke.url} href={spoke.url} className={cx.compactItem}>
                {spoke.title}
              </a>
            ))}
          </div>
        ) : (
          <div className={cx.grid}>
            {spokes.map((spoke) => (
              <SpokeCard key={spoke.url} spoke={spoke} content={content} classNames={cx} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SpokeCard({
  classNames,
  content,
  spoke,
}: {
  classNames: typeof hubSpokesDefaults;
  content: HubSpokesBlock['content'];
  spoke: HubSpokeLink;
}) {
  return (
    <article className={classNames.card}>
      <h3 className={classNames.itemTitle}>{spoke.title}</h3>
      {content.showExcerpt && spoke.description && (
        <p className={classNames.itemDescription}>{spoke.description}</p>
      )}
      {content.showLocation && getLocation(spoke) && (
        <p className={classNames.itemMeta}>{getLocation(spoke)}</p>
      )}
      <a href={spoke.url} className={classNames.itemLink}>
        {content.ctaText || 'Learn more'} &rarr;
      </a>
    </article>
  );
}

function SpokeListItem({
  classNames,
  content,
  spoke,
}: {
  classNames: typeof hubSpokesDefaults;
  content: HubSpokesBlock['content'];
  spoke: HubSpokeLink;
}) {
  return (
    <a href={spoke.url} className={classNames.listItem}>
      <h3 className={classNames.itemTitle}>{spoke.title}</h3>
      {content.showExcerpt && spoke.description && (
        <p className={classNames.itemDescription}>{spoke.description}</p>
      )}
      {content.showLocation && getLocation(spoke) && (
        <p className={classNames.itemMeta}>{getLocation(spoke)}</p>
      )}
    </a>
  );
}

function getLocation(spoke: HubSpokeLink) {
  return [spoke.city, spoke.metro, spoke.state]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(', ');
}
