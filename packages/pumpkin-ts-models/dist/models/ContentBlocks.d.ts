import type { IHtmlBlock } from './IHtmlBlock';
import type { ImageAspect, ImageFit, ImagePosition } from './ImagePresentation';
export interface Card {
    title: string;
    description: string;
    image: string;
    "image-alt": string;
    icon: string;
    link: string;
    alt: string;
}
export interface CardGridContent {
    title: string;
    subtitle: string;
    layout: string;
    imageAspect?: ImageAspect;
    imageFit?: ImageFit;
    imagePosition?: ImagePosition;
    cards: Card[];
}
export interface CardGridBlock extends IHtmlBlock {
    type: "CardGrid";
    content: CardGridContent;
}
export interface FaqItem {
    question: string;
    answer: string;
}
export interface FaqContent {
    title: string;
    subtitle: string;
    layout: string;
    items: FaqItem[];
}
export interface FaqBlock extends IHtmlBlock {
    type: "FAQ";
    content: FaqContent;
}
export type HubSpokesLayout = string;
export interface HubSpokeLink {
    title: string;
    description: string;
    url: string;
    city: string;
    state: string;
    metro: string;
    spokePriority: number;
}
export interface HubSpokesContent {
    title: string;
    subtitle: string;
    hubPageSlug: string;
    layout: HubSpokesLayout;
    limit: number;
    showExcerpt: boolean;
    showLocation: boolean;
    ctaText: string;
    spokes: HubSpokeLink[];
}
export interface HubSpokesBlock extends IHtmlBlock {
    type: "HubSpokes";
    content: HubSpokesContent;
}
//# sourceMappingURL=ContentBlocks.d.ts.map