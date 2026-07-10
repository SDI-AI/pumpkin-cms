import { IHtmlBlock } from './IHtmlBlock';
import type { ImageAspect, ImageFit, ImagePosition } from './ImagePresentation';
/**
 * Related blog post reference
 */
export interface RelatedPost {
    title: string;
    slug: string;
    excerpt: string;
    image: string;
    imageAlt: string;
    publishedDate: string;
}
/**
 * Blog block content structure
 */
export interface BlogContent {
    title: string;
    subtitle: string;
    author: string;
    authorImage: string;
    authorBio: string;
    publishedDate: string;
    featuredImage: string;
    featuredImageAlt: string;
    featuredImageAspect?: ImageAspect;
    featuredImageFit?: ImageFit;
    featuredImagePosition?: ImagePosition;
    excerpt: string;
    body: string;
    tags: string[];
    categories: string[];
    readingTime: number;
    relatedImageAspect?: ImageAspect;
    relatedImageFit?: ImageFit;
    relatedImagePosition?: ImagePosition;
    relatedPosts: RelatedPost[];
}
/**
 * Blog block for displaying blog post content
 */
export interface BlogBlock extends IHtmlBlock {
    type: 'Blog';
    content: BlogContent;
}
//# sourceMappingURL=BlogBlocks.d.ts.map