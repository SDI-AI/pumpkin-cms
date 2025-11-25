import { IHtmlBlock } from './IHtmlBlock';
/**
 * Primary CTA block content structure
 */
export interface PrimaryCtaContent {
    title: string;
    description: string;
    buttonText: string;
    buttonLink: string;
    secondaryText: string;
    secondaryLinkText: string;
    secondaryLink: string;
    backgroundImage: string;
    mainImage: string;
    alt: string;
}
/**
 * Primary call-to-action block
 */
export interface PrimaryCtaBlock extends IHtmlBlock {
    type: 'PrimaryCTA';
    content: PrimaryCtaContent;
}
/**
 * Secondary CTA block content structure
 */
export interface SecondaryCtaContent {
    title: string;
    description: string;
    buttonText: string;
    buttonLink: string;
}
/**
 * Secondary call-to-action block
 */
export interface SecondaryCtaBlock extends IHtmlBlock {
    type: 'SecondaryCTA';
    content: SecondaryCtaContent;
}
//# sourceMappingURL=CtaBlocks.d.ts.map