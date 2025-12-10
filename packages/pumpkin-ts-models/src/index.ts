// Core interfaces and types
export type { IHtmlBlock, GenericHtmlBlock } from './models/IHtmlBlock';

// Tenant models
export type {
  Tenant,
  ApiKeyMeta,
  TenantSettings,
  Features,
  Contact,
  Billing
} from './models/Tenant';

// Page models
export type {
  Page,
  PageMetaData,
  SearchData,
  ContentData,
  SeoData,
  AlternateUrl,
  OpenGraphData,
  TwitterCardData
} from './models/Page';

// Hero blocks
export type {
  HeroType,
  HeroContent,
  HeroBlock
} from './models/HeroBlocks';

// CTA blocks
export type {
  PrimaryCtaContent,
  PrimaryCtaBlock,
  SecondaryCtaContent,
  SecondaryCtaBlock
} from './models/CtaBlocks';

// Content blocks
export type {
  Card,
  CardGridContent,
  CardGridBlock,
  FaqItem,
  FaqContent,
  FaqBlock
} from './models/ContentBlocks';

// Navigation blocks
export type {
  BreadcrumbItem,
  BreadcrumbsContent,
  BreadcrumbsBlock,
  TrustBarItem,
  TrustBarContent,
  TrustBarBlock,
  Step,
  HowItWorksContent,
  HowItWorksBlock,
  ServiceAreaMapContent,
  ServiceAreaMapBlock,
  ProTipItem,
  LocalProTipsContent,
  LocalProTipsBlock
} from './models/NavigationBlocks';

// Interaction blocks
export type {
  GalleryImage,
  GalleryContent,
  GalleryBlock,
  TestimonialItem,
  TestimonialsContent,
  TestimonialsBlock,
  FormField,
  SocialLink,
  ContactContent,
  ContactBlock
} from './models/InteractionBlocks';

// Block types and utilities
export type {
  HtmlBlock
} from './models/HtmlBlockTypes';

export {
  BLOCK_TYPE_MAP,
  SUPPORTED_BLOCK_TYPES,
  isBlockOfType,
  isHtmlBlock,
  createGenericBlock
} from './models/HtmlBlockTypes';

// JSON converter
export { PageJsonConverter } from './PageJsonConverter';
export type { JsonConverterOptions } from './PageJsonConverter';