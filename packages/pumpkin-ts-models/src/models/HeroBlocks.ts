import { IHtmlBlock } from './IHtmlBlock';

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
  mainImage: string;
  mainImageAltText: string;
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