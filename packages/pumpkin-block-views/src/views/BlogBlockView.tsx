import React from 'react';
import type { BlogBlock } from 'pumpkin-ts-models';
import { blogDefaults, type BlogClassNames } from '../defaults/blog';
import { mergeClasses } from '../utils/mergeClasses';

export interface BlogBlockViewProps {
  block: BlogBlock;
  classNames?: BlogClassNames;
  /** Optional render function for the body content (e.g. to use a Markdown renderer). Falls back to dangerouslySetInnerHTML. */
  renderBody?: (body: string) => React.ReactNode;
}

export function BlogBlockView({ block, classNames, renderBody }: BlogBlockViewProps) {
  const cx = mergeClasses(blogDefaults, classNames);
  const { content } = block;

  return (
    <article className={cx.root}>
      <div className={cx.container}>
        {content.featuredImage && (
          <img src={content.featuredImage} alt={content.featuredImageAlt || ''} className={cx.featuredImage} />
        )}

        <header className={cx.header}>
          <h1 className={cx.title}>{content.title}</h1>
          {content.subtitle && <p className={cx.subtitle}>{content.subtitle}</p>}

          <div className={cx.meta}>
            {content.author && (
              <div className={cx.authorWrapper}>
                {content.authorImage && (
                  <img src={content.authorImage} alt={content.author} className={cx.authorImage} />
                )}
                <span className={cx.authorName}>{content.author}</span>
              </div>
            )}
            {content.publishedDate && <span className={cx.date}>{content.publishedDate}</span>}
            {content.readingTime > 0 && <span className={cx.readingTime}>{content.readingTime} min read</span>}
          </div>

          {content.tags?.length > 0 && (
            <div className={cx.tags}>
              {content.tags.map((tag, i) => (
                <span key={i} className={cx.tag}>{tag}</span>
              ))}
            </div>
          )}
        </header>

        {content.body && (
          <div className={cx.body}>
            {renderBody ? renderBody(content.body) : (
              <div dangerouslySetInnerHTML={{ __html: content.body }} />
            )}
          </div>
        )}

        {content.relatedPosts?.length > 0 && (
          <div className={cx.relatedSection}>
            <h2 className={cx.relatedTitle}>Related Posts</h2>
            <div className={cx.relatedGrid}>
              {content.relatedPosts.map((post, i) => (
                <a key={i} href={post.slug} className={cx.relatedCard}>
                  {post.image && (
                    <img src={post.image} alt={post.imageAlt || ''} className={cx.relatedCardImage} />
                  )}
                  <div className={cx.relatedCardBody}>
                    <h3 className={cx.relatedCardTitle}>{post.title}</h3>
                    {post.excerpt && <p className={cx.relatedCardExcerpt}>{post.excerpt}</p>}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
