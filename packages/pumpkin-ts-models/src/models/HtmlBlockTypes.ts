import { IHtmlBlock } from './IHtmlBlock';
import { HeroBlock } from './HeroBlocks';
import { PrimaryCtaBlock, SecondaryCtaBlock } from './CtaBlocks';
import { CardGridBlock, FaqBlock } from './ContentBlocks';
import { BreadcrumbsBlock, TrustBarBlock, HowItWorksBlock, ServiceAreaMapBlock, LocalProTipsBlock } from './NavigationBlocks';
import { GalleryBlock, TestimonialsBlock, ContactBlock } from './InteractionBlocks';

/**
 * Union type of all supported HTML blocks
 */
export type HtmlBlock = 
  | HeroBlock
  | PrimaryCtaBlock
  | SecondaryCtaBlock
  | CardGridBlock
  | FaqBlock
  | BreadcrumbsBlock
  | TrustBarBlock
  | HowItWorksBlock
  | ServiceAreaMapBlock
  | LocalProTipsBlock
  | GalleryBlock
  | TestimonialsBlock
  | ContactBlock;

/**
 * Map of block types to their corresponding interfaces
 */
export const BLOCK_TYPE_MAP = {
  'Hero': 'HeroBlock',
  'PrimaryCTA': 'PrimaryCtaBlock',
  'SecondaryCTA': 'SecondaryCtaBlock',
  'CardGrid': 'CardGridBlock',
  'FAQ': 'FaqBlock',
  'Breadcrumbs': 'BreadcrumbsBlock',
  'TrustBar': 'TrustBarBlock',
  'HowItWorks': 'HowItWorksBlock',
  'ServiceAreaMap': 'ServiceAreaMapBlock',
  'LocalProTips': 'LocalProTipsBlock',
  'Gallery': 'GalleryBlock',
  'Testimonials': 'TestimonialsBlock',
  'Contact': 'ContactBlock'
} as const;

/**
 * Array of all supported block types
 */
export const SUPPORTED_BLOCK_TYPES = Object.keys(BLOCK_TYPE_MAP) as Array<keyof typeof BLOCK_TYPE_MAP>;

/**
 * Type guard to check if a block is a specific type
 */
export function isBlockOfType<T extends HtmlBlock['type']>(
  block: IHtmlBlock,
  type: T
): block is Extract<HtmlBlock, { type: T }> {
  return block.type === type;
}

/**
 * Type guard to check if an object is a valid HTML block
 */
export function isHtmlBlock(obj: any): obj is IHtmlBlock {
  return obj && typeof obj.type === 'string' && typeof obj.content === 'object';
}

/**
 * Creates a generic HTML block for unknown types
 */
export function createGenericBlock(type: string, content: Record<string, any>): IHtmlBlock {
  return {
    type,
    content
  };
}