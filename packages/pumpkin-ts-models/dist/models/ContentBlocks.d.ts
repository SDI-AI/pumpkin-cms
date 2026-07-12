import { IHtmlBlock } from './IHtmlBlock';
import type { ImageAspect, ImageFit, ImagePosition } from './ImagePresentation';
/**
 * Individual card within a card grid
 */
export interface Card {
    title: string;
    description: string;
    image: string;
    'image-alt': string;
    icon: string;
    link: string;
    alt: string;
}
/**
 * Card grid content structure
 */
export interface CardGridContent {
    title: string;
    subtitle: string;
    layout: string;
    imageAspect?: ImageAspect;
    imageFit?: ImageFit;
    imagePosition?: ImagePosition;
    cards: Card[];
}
/**
 * Card grid block for displaying cards in a grid layout
 */
export interface CardGridBlock extends IHtmlBlock {
    type: 'CardGrid';
    content: CardGridContent;
}
/**
 * Individual FAQ item
 */
export interface FaqItem {
    question: string;
    answer: string;
}
/**
 * FAQ content structure
 */
export interface FaqContent {
    title: string;
    subtitle: string;
    layout: string;
    items: FaqItem[];
}
/**
 * FAQ block for frequently asked questions
 */
export interface FaqBlock extends IHtmlBlock {
    type: 'FAQ';
    content: FaqContent;
}
/**
 * A lightweight public link to a spoke page connected to a hub.
 */
export interface HubSpokeLink {
    title: string;
    description: string;
    url: string;
    city: string;
    state: string;
    metro: string;
    spokePriority: number;
}
export type HubSpokesLayout = 'cards' | 'list' | 'compact' | string;
/**
 * Hub spokes content structure.
 * `spokes` is hydrated at render time by the starter app from published pages.
 */
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
/**
 * Block for displaying published spoke pages linked to a hub.
 */
export interface HubSpokesBlock extends IHtmlBlock {
    type: 'HubSpokes';
    content: HubSpokesContent;
}
//# sourceMappingURL=ContentBlocks.d.ts.map