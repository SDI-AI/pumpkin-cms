import { IHtmlBlock } from './IHtmlBlock';
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
//# sourceMappingURL=ContentBlocks.d.ts.map