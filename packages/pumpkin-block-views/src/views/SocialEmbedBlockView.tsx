import React, { useEffect, useMemo } from 'react';
import type { SocialEmbedBlock, SocialEmbedItem } from 'pumpkin-ts-models';
import { socialEmbedDefaults, type SocialEmbedClassNames } from '../defaults/socialEmbed';
import { imagePresentationClasses } from '../utils/imagePresentation';
import { mergeClasses } from '../utils/mergeClasses';

export interface SocialEmbedBlockViewProps {
  block: SocialEmbedBlock;
  classNames?: SocialEmbedClassNames;
}

const providerScripts = {
  Instagram: 'https://www.instagram.com/embed.js',
  TikTok: 'https://www.tiktok.com/embed.js',
  X: 'https://platform.twitter.com/widgets.js',
  Pinterest: 'https://assets.pinterest.com/js/pinit.js',
} as const;

export function SocialEmbedBlockView({ block, classNames }: SocialEmbedBlockViewProps) {
  const cx = mergeClasses(socialEmbedDefaults, classNames);
  const { content } = block;
  const layout = content.layout || 'grid';
  const items = useMemo(() => (content.items ?? []).filter((item) => item.url?.trim()), [content.items]);

  useEffect(() => {
    for (const item of items) {
      loadProviderScript(item.platform);
    }
  }, [items]);

  const listClass = layout === 'stack'
    ? cx.stack
    : layout === 'carousel'
      ? cx.carousel
      : cx.grid;

  return (
    <section className={cx.root}>
      <div className={cx.container}>
        {(content.title || content.subtitle) && (
          <div className={cx.header}>
            {content.title && <h2 className={cx.title}>{content.title}</h2>}
            {content.subtitle && <p className={cx.subtitle}>{content.subtitle}</p>}
          </div>
        )}
        {items.length > 0 ? (
          <div className={listClass}>
            {items.map((item, index) => (
              <article key={`${item.platform}-${item.url}-${index}`} className={`${cx.item} ${layout === 'carousel' ? cx.itemCarousel : ''}`.trim()}>
                <div className={`${cx.embedWrapper} ${imagePresentationClasses({ aspect: content.aspect || 'auto', fit: 'cover', position: 'center' })}`}>
                  <SocialEmbedFrame item={item} classNames={cx} />
                </div>
                {item.caption && <p className={cx.caption}>{item.caption}</p>}
              </article>
            ))}
          </div>
        ) : (
          <div className={cx.fallback}>Add one or more supported social URLs to display embeds.</div>
        )}
      </div>
    </section>
  );
}

function SocialEmbedFrame({ item, classNames: cx }: { item: SocialEmbedItem; classNames: typeof socialEmbedDefaults }) {
  const url = normalizeUrl(item.url);
  if (!url) return <EmbedFallback item={item} classNames={cx} />;
  if (!matchesPlatformHost(item.platform, url)) return <EmbedFallback item={item} classNames={cx} />;

  if (item.platform === 'YouTube') {
    const src = youtubeEmbedUrl(url);
    return src ? <iframe className={cx.embedFrame} src={src} title="YouTube embed" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : <EmbedFallback item={item} classNames={cx} />;
  }

  if (item.platform === 'Facebook') {
    const src = facebookEmbedUrl(url);
    return <iframe className={cx.embedFrame} src={src} title="Facebook embed" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowFullScreen />;
  }

  if (item.platform === 'Instagram') {
    return <blockquote className="instagram-media" data-instgrm-permalink={url.href} data-instgrm-version="14"><a href={url.href}>View post on Instagram</a></blockquote>;
  }

  if (item.platform === 'TikTok') {
    return <blockquote className="tiktok-embed" cite={url.href} data-video-id={tiktokVideoId(url)}><section /></blockquote>;
  }

  if (item.platform === 'X') {
    if (isXStatusUrl(url)) {
      return <blockquote className="twitter-tweet"><a href={url.href}>View post on X</a></blockquote>;
    }
    return <a className="twitter-timeline" href={url.href}>View posts on X</a>;
  }

  if (item.platform === 'Pinterest') {
    return <a href={url.href} data-pin-do={pinterestEmbedType(url)}>View on Pinterest</a>;
  }

  if (item.platform === 'LinkedIn' && isLinkedInEmbedUrl(url)) {
    return <iframe className={cx.embedFrame} src={url.href} title="LinkedIn embed" allowFullScreen />;
  }

  return <EmbedFallback item={item} classNames={cx} />;
}

function EmbedFallback({ item, classNames: cx }: { item: SocialEmbedItem; classNames: typeof socialEmbedDefaults }) {
  return (
    <div className={cx.fallback}>
      <span>
        {item.platform} embed unavailable.{' '}
        {item.url && <a className={cx.fallbackLink} href={item.url} target="_blank" rel="noreferrer">Open source</a>}
      </span>
    </div>
  );
}

function loadProviderScript(platform: SocialEmbedItem['platform']) {
  if (typeof document === 'undefined') return;
  const src = providerScripts[platform as keyof typeof providerScripts];
  if (!src || document.querySelector(`script[src="${src}"]`)) {
    triggerProviderScan(platform);
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.defer = true;
  script.src = src;
  script.onload = () => triggerProviderScan(platform);
  document.body.appendChild(script);
}

function triggerProviderScan(platform: SocialEmbedItem['platform']) {
  const win = window as typeof window & {
    instgrm?: { Embeds?: { process?: () => void } };
    twttr?: { widgets?: { load?: () => void } };
    PinUtils?: { build?: () => void };
  };

  if (platform === 'Instagram') win.instgrm?.Embeds?.process?.();
  if (platform === 'X') win.twttr?.widgets?.load?.();
  if (platform === 'Pinterest') win.PinUtils?.build?.();
}

function normalizeUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

function matchesPlatformHost(platform: SocialEmbedItem['platform'], url: URL) {
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  if (platform === 'YouTube') return host === 'youtu.be' || host.endsWith('youtube.com');
  if (platform === 'Facebook') return host.endsWith('facebook.com');
  if (platform === 'Instagram') return host.endsWith('instagram.com');
  if (platform === 'TikTok') return host.endsWith('tiktok.com');
  if (platform === 'X') return host === 'x.com' || host.endsWith('twitter.com');
  if (platform === 'Pinterest') return host.endsWith('pinterest.com') || host === 'pin.it';
  if (platform === 'LinkedIn') return host.endsWith('linkedin.com');
  return false;
}

function youtubeEmbedUrl(url: URL) {
  const host = url.hostname.replace(/^www\./, '');
  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
  }
  if (!host.endsWith('youtube.com')) return null;

  const list = url.searchParams.get('list');
  if (url.pathname.startsWith('/playlist') && list) {
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(list)}`;
  }

  const segments = url.pathname.split('/').filter(Boolean);
  const id = url.searchParams.get('v') || segments[segments.length - 1];
  return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
}

function facebookEmbedUrl(url: URL) {
  const href = encodeURIComponent(url.href);
  const isPost = /\/(posts|videos|photos|reel)\//i.test(url.pathname) || url.searchParams.has('story_fbid');
  return isPost
    ? `https://www.facebook.com/plugins/post.php?href=${href}&show_text=true&width=500`
    : `https://www.facebook.com/plugins/page.php?href=${href}&tabs=timeline&width=500&height=500&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=false`;
}

function tiktokVideoId(url: URL) {
  const match = url.pathname.match(/\/video\/(\d+)/);
  return match?.[1];
}

function isXStatusUrl(url: URL) {
  return /\/status(es)?\//i.test(url.pathname);
}

function pinterestEmbedType(url: URL) {
  if (/\/pin\//i.test(url.pathname)) return 'embedPin';
  const segments = url.pathname.split('/').filter(Boolean);
  return segments.length >= 2 ? 'embedBoard' : 'embedUser';
}

function isLinkedInEmbedUrl(url: URL) {
  return url.hostname.endsWith('linkedin.com') && url.pathname.startsWith('/embed/');
}
