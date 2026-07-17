import type { IHtmlBlock } from './IHtmlBlock';
import type { ImageAspect, ImageFit, ImagePosition } from './ImagePresentation';
export type HeroType = "Main" | "Secondary" | "Tertiary";
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
export interface HeroBlock extends IHtmlBlock {
    type: "Hero";
    content: HeroContent;
}
//# sourceMappingURL=HeroBlocks.d.ts.map