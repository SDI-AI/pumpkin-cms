import { IHtmlBlock } from './IHtmlBlock';
import type { ImageAspect, ImageFit, ImagePosition } from './ImagePresentation';
/**
 * Hero block variant types
 */
export type HeroType = 'Main' | 'Secondary' | 'Tertiary';
/**
 * Hero block content structure
 */
export interface HeroContent {
    type: HeroType;
    headline: string;
    subheadline: string;
    backgroundImage: string;
    backgroundImageAltText: string;
    backgroundImagePosition?: ImagePosition;
    mainImage: string;
    mainImageAltText: string;
    mainImageAspect?: ImageAspect;
    mainImageFit?: ImageFit;
    mainImagePosition?: ImagePosition;
    buttonText: string;
    buttonLink: string;
}
/**
 * Hero block with variant support
 */
export interface HeroBlock extends IHtmlBlock {
    type: 'Hero';
    content: HeroContent;
}
//# sourceMappingURL=HeroBlocks.d.ts.map