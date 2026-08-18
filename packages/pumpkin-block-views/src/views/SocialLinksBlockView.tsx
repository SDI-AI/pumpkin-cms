import React from 'react';
import type { SocialLinksBlock, SocialLinksPlatform } from 'pumpkin-ts-models';
import { socialLinksDefaults, type SocialLinksClassNames } from '../defaults/socialLinks';
import { Icon } from '../components/Icon';
import { mergeClasses } from '../utils/mergeClasses';

export interface SocialLinksBlockViewProps {
  block: SocialLinksBlock;
  classNames?: SocialLinksClassNames;
}

export function SocialLinksBlockView({ block, classNames }: SocialLinksBlockViewProps) {
  const cx = mergeClasses(socialLinksDefaults, classNames);
  const { content } = block;
  const links = (content.links ?? []).filter((link) => safeUrl(link.url));
  const listClass = content.layout === 'grid' ? cx.listGrid : content.layout === 'stack' ? cx.listStack : cx.list;

  return (
    <section className={cx.root}>
      <div className={cx.container}>
        {(content.title || content.subtitle) && (
          <div className={cx.header}>
            {content.title && <h2 className={cx.title}>{content.title}</h2>}
            {content.subtitle && <p className={cx.subtitle}>{content.subtitle}</p>}
          </div>
        )}

        {links.length > 0 ? (
          <div className={listClass}>
            {links.map((link, index) => (
              <a key={`${link.platform}-${link.url}-${index}`} className={cx.link} href={link.url} target="_blank" rel="noreferrer">
                <Icon name={link.icon || defaultSocialIcon(link.platform)} className={cx.icon} size={20} />
                <span className={cx.label}>{link.label || platformLabel(link.platform)}</span>
              </a>
            ))}
          </div>
        ) : (
          <div className={cx.empty}>Add one or more social profile links to display this block.</div>
        )}
      </div>
    </section>
  );
}

function safeUrl(value?: string) {
  try {
    const url = new URL((value ?? '').trim());
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function defaultSocialIcon(platform: SocialLinksPlatform) {
  const icons: Record<SocialLinksPlatform, string> = {
    Instagram: 'Instagram',
    Facebook: 'Facebook',
    TikTok: 'Music2',
    YouTube: 'Youtube',
    X: 'Twitter',
    Pinterest: 'Badge',
    LinkedIn: 'Linkedin',
    Yelp: 'Star',
    GoogleBusiness: 'Search',
    Other: 'Globe2',
  };
  return icons[platform] ?? 'Globe2';
}

function platformLabel(platform: SocialLinksPlatform) {
  return platform === 'GoogleBusiness' ? 'Google Business' : platform;
}
