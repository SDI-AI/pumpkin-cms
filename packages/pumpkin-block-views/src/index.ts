// ── Components ─────────────────────────────────────────────
export { Icon } from './components/Icon';
export type { IconProps } from './components/Icon';
export { TurnstileWidget } from './components/TurnstileWidget';
export type { TurnstileWidgetProps } from './components/TurnstileWidget';

// ── Views ──────────────────────────────────────────────────
export {
  HeroBlockView,
  PrimaryCtaBlockView,
  SecondaryCtaBlockView,
  CardGridBlockView,
  FaqBlockView,
  HubSpokesBlockView,
  BreadcrumbsBlockView,
  TrustBarBlockView,
  HowItWorksBlockView,
  ServiceAreaMapBlockView,
  LocalProTipsBlockView,
  GalleryBlockView,
  TestimonialsBlockView,
  SocialEmbedBlockView,
  ContactBlockView,
  FormBlockView,
  BlogBlockView,
  HeaderView,
  FooterView,
} from './views';

export type {
  HeroBlockViewProps,
  PrimaryCtaBlockViewProps,
  SecondaryCtaBlockViewProps,
  CardGridBlockViewProps,
  FaqBlockViewProps,
  HubSpokesBlockViewProps,
  BreadcrumbsBlockViewProps,
  TrustBarBlockViewProps,
  HowItWorksBlockViewProps,
  ServiceAreaMapBlockViewProps,
  LocalProTipsBlockViewProps,
  GalleryBlockViewProps,
  TestimonialsBlockViewProps,
  SocialEmbedBlockViewProps,
  ContactBlockViewProps,
  FormBlockViewProps,
  BlogBlockViewProps,
  HeaderViewProps,
  FooterViewProps,
} from './views';

// ── Factory Renderer ───────────────────────────────────────
export { BlockViewRenderer } from './BlockViewRenderer';
export type { BlockViewRendererProps, BlockClassNamesMap, BlockOverrides } from './BlockViewRenderer';

// ── Default Class Constants ────────────────────────────────
export {
  heroDefaults,
  primaryCtaDefaults,
  secondaryCtaDefaults,
  cardGridDefaults,
  faqDefaults,
  hubSpokesDefaults,
  breadcrumbsDefaults,
  trustBarDefaults,
  howItWorksDefaults,
  serviceAreaMapDefaults,
  localProTipsDefaults,
  galleryDefaults,
  testimonialsDefaults,
  socialEmbedDefaults,
  contactDefaults,
  formDefaults,
  blogDefaults,
  headerDefaults,
  footerDefaults,
} from './defaults';

export type {
  HeroClassNames,
  PrimaryCtaClassNames,
  SecondaryCtaClassNames,
  CardGridClassNames,
  FaqClassNames,
  HubSpokesClassNames,
  BreadcrumbsClassNames,
  TrustBarClassNames,
  HowItWorksClassNames,
  ServiceAreaMapClassNames,
  LocalProTipsClassNames,
  GalleryClassNames,
  TestimonialsClassNames,
  SocialEmbedClassNames,
  ContactClassNames,
  FormClassNames,
  BlogClassNames,
  HeaderClassNames,
  FooterClassNames,
} from './defaults';

// ── Utilities ──────────────────────────────────────────────
export { mergeClasses } from './utils/mergeClasses';
