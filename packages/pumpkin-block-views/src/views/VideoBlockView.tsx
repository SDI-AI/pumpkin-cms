import React from 'react';
import type { VideoBlock } from 'pumpkin-ts-models';
import { videoDefaults, type VideoClassNames } from '../defaults/video';
import { imagePresentationClasses } from '../utils/imagePresentation';
import { mergeClasses } from '../utils/mergeClasses';

export interface VideoBlockViewProps {
  block: VideoBlock;
  classNames?: VideoClassNames;
}

export function VideoBlockView({ block, classNames }: VideoBlockViewProps) {
  const cx = mergeClasses(videoDefaults, classNames);
  const { content } = block;
  const src = videoEmbedUrl(content);

  return (
    <section className={cx.root}>
      <div className={cx.container}>
        {(content.title || content.subtitle) && (
          <div className={cx.header}>
            {content.title && <h2 className={cx.title}>{content.title}</h2>}
            {content.subtitle && <p className={cx.subtitle}>{content.subtitle}</p>}
          </div>
        )}

        {src ? (
          <>
            <div className={`${cx.frameWrapper} ${imagePresentationClasses({ aspect: content.aspect || '16:9', fit: 'cover', position: 'center' })}`}>
              <iframe className={cx.frame} src={src} title={content.title || 'Embedded video'} allow={allowPolicy(content.autoplay)} allowFullScreen />
            </div>
            {content.caption && <p className={cx.caption}>{content.caption}</p>}
          </>
        ) : (
          <div className={cx.fallback}>
            <span>
              Video unavailable.{' '}
              {content.url && <a className={cx.fallbackLink} href={content.url} target="_blank" rel="noreferrer">Open source</a>}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

function videoEmbedUrl(content: VideoBlock['content']) {
  const url = normalizeHttpsUrl(content.url);
  if (!url) return null;

  if (content.provider === 'YouTube') {
    const src = youtubeEmbedUrl(url);
    return src ? withPlaybackParams(src, content) : null;
  }

  if (content.provider === 'Vimeo') {
    const src = vimeoEmbedUrl(url);
    return src ? withPlaybackParams(src, content) : null;
  }

  return withPlaybackParams(url.href, content);
}

function normalizeHttpsUrl(value?: string) {
  try {
    const url = new URL((value ?? '').trim());
    return url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

function youtubeEmbedUrl(url: URL) {
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
  }
  if (!host.endsWith('youtube.com')) return null;
  const segments = url.pathname.split('/').filter(Boolean);
  const id = url.searchParams.get('v') || segments[segments.length - 1];
  return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
}

function vimeoEmbedUrl(url: URL) {
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  if (!host.endsWith('vimeo.com')) return null;
  const id = url.pathname.split('/').filter(Boolean).find((segment) => /^\d+$/.test(segment));
  return id ? `https://player.vimeo.com/video/${encodeURIComponent(id)}` : null;
}

function withPlaybackParams(src: string, content: VideoBlock['content']) {
  const url = new URL(src);
  if (content.autoplay) url.searchParams.set('autoplay', '1');
  if (content.muted || content.autoplay) url.searchParams.set('muted', '1');
  return url.href;
}

function allowPolicy(autoplay: boolean) {
  return autoplay
    ? 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
    : 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
}
