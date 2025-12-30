import { IHtmlBlock } from './IHtmlBlock';
import { HeroBlock } from './HeroBlocks';
import { PrimaryCtaBlock, SecondaryCtaBlock } from './CtaBlocks';
import { CardGridBlock, FaqBlock } from './ContentBlocks';
import { BreadcrumbsBlock, TrustBarBlock, HowItWorksBlock, ServiceAreaMapBlock, LocalProTipsBlock } from './NavigationBlocks';
import { GalleryBlock, TestimonialsBlock, ContactBlock } from './InteractionBlocks';
import { BlogBlock } from './BlogBlocks';
/**
 * Union type of all supported HTML blocks
 */
export type HtmlBlock = HeroBlock | PrimaryCtaBlock | SecondaryCtaBlock | CardGridBlock | FaqBlock | BreadcrumbsBlock | TrustBarBlock | HowItWorksBlock | ServiceAreaMapBlock | LocalProTipsBlock | GalleryBlock | TestimonialsBlock | ContactBlock | BlogBlock;
/**
 * Map of block types to their corresponding interfaces
 */
export declare const BLOCK_TYPE_MAP: {
    readonly Hero: "HeroBlock";
    readonly PrimaryCTA: "PrimaryCtaBlock";
    readonly SecondaryCTA: "SecondaryCtaBlock";
    readonly CardGrid: "CardGridBlock";
    readonly FAQ: "FaqBlock";
    readonly Breadcrumbs: "BreadcrumbsBlock";
    readonly TrustBar: "TrustBarBlock";
    readonly HowItWorks: "HowItWorksBlock";
    readonly ServiceAreaMap: "ServiceAreaMapBlock";
    readonly LocalProTips: "LocalProTipsBlock";
    readonly Gallery: "GalleryBlock";
    readonly Testimonials: "TestimonialsBlock";
    readonly Contact: "ContactBlock";
    readonly Blog: "BlogBlock";
};
/**
 * Array of all supported block types
 */
export declare const SUPPORTED_BLOCK_TYPES: Array<keyof typeof BLOCK_TYPE_MAP>;
/**
 * Type guard to check if a block is a specific type
 */
export declare function isBlockOfType<T extends HtmlBlock['type']>(block: IHtmlBlock, type: T): block is Extract<HtmlBlock, {
    type: T;
}>;
/**
 * Type guard to check if an object is a valid HTML block
 */
export declare function isHtmlBlock(obj: any): obj is IHtmlBlock;
/**
 * Creates a generic HTML block for unknown types
 */
export declare function createGenericBlock(type: string, content: Record<string, any>): IHtmlBlock;
//# sourceMappingURL=HtmlBlockTypes.d.ts.map