// ── Views ──────────────────────────────────────────────────
export {
  HeroBlockView,
  PrimaryCtaBlockView,
  SecondaryCtaBlockView,
  CardGridBlockView,
  FaqBlockView,
  BreadcrumbsBlockView,
  TrustBarBlockView,
  HowItWorksBlockView,
  ServiceAreaMapBlockView,
  LocalProTipsBlockView,
  GalleryBlockView,
  TestimonialsBlockView,
  ContactBlockView,
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
  BreadcrumbsBlockViewProps,
  TrustBarBlockViewProps,
  HowItWorksBlockViewProps,
  ServiceAreaMapBlockViewProps,
  LocalProTipsBlockViewProps,
  GalleryBlockViewProps,
  TestimonialsBlockViewProps,
  ContactBlockViewProps,
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
  breadcrumbsDefaults,
  trustBarDefaults,
  howItWorksDefaults,
  serviceAreaMapDefaults,
  localProTipsDefaults,
  galleryDefaults,
  testimonialsDefaults,
  contactDefaults,
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
  BreadcrumbsClassNames,
  TrustBarClassNames,
  HowItWorksClassNames,
  ServiceAreaMapClassNames,
  LocalProTipsClassNames,
  GalleryClassNames,
  TestimonialsClassNames,
  ContactClassNames,
  BlogClassNames,
  HeaderClassNames,
  FooterClassNames,
} from './defaults';

// ── Utilities ──────────────────────────────────────────────
export { mergeClasses } from './utils/mergeClasses';
