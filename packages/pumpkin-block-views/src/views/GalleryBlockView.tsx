import React from 'react';
import type { GalleryBlock } from 'pumpkin-ts-models';
import { galleryDefaults, type GalleryClassNames } from '../defaults/gallery';
import { mergeClasses } from '../utils/mergeClasses';

export interface GalleryBlockViewProps {
  block: GalleryBlock;
  classNames?: GalleryClassNames;
}

export function GalleryBlockView({ block, classNames }: GalleryBlockViewProps) {
  const cx = mergeClasses(galleryDefaults, classNames);
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
          {content.images.map((img, i) => (
            <div key={i} className={cx.imageWrapper}>
              <img src={img.src} alt={img.alt || ''} className={cx.image} />
              {img.caption && <div className={cx.caption}>{img.caption}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
