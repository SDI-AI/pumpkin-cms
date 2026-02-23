import React from 'react';
import type { BreadcrumbsBlock } from 'pumpkin-ts-models';
import { breadcrumbsDefaults, type BreadcrumbsClassNames } from '../defaults/breadcrumbs';
import { mergeClasses } from '../utils/mergeClasses';

export interface BreadcrumbsBlockViewProps {
  block: BreadcrumbsBlock;
  classNames?: BreadcrumbsClassNames;
}

export function BreadcrumbsBlockView({ block, classNames }: BreadcrumbsBlockViewProps) {
  const cx = mergeClasses(breadcrumbsDefaults, classNames);
  const { content } = block;

  return (
    <nav className={cx.root} aria-label="Breadcrumb">
      <div className={cx.container}>
        <ol className={cx.list}>
          {content.items.map((item, i) => (
            <li key={i} className={item.current ? cx.itemCurrent : cx.item}>
              {i > 0 && <span className={cx.separator} aria-hidden="true">/</span>}
              {item.current ? (
                <span aria-current="page">{item.label}</span>
              ) : (
                <a href={item.url} className={cx.link}>{item.label}</a>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
