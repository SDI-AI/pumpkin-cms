// Core interfaces and types
export type { IHtmlBlock, GenericHtmlBlock } from './models/IHtmlBlock';
export type {
  ImageAspect,
  ImageFit,
  ImagePosition,
  ImagePresentation
} from './models/ImagePresentation';

// User models
export type {
  User,
  LoginRequest,
  LoginResponse,
  UserInfo
} from './models/User';

export {
  UserRole,
  userRoleToString,
  stringToUserRole,
  isUserRole,
  userToUserInfo
} from './models/User';

// Tenant models
export type {
  Tenant,
  ApiKeyMeta,
  TenantSettings,
  TenantFormSecuritySettings,
  TenantCaptchaSettings,
  Features,
  Contact,
  Billing,
  TenantInfo
} from './models/Tenant';

export {
  tenantToTenantInfo
} from './models/Tenant';

// Media models
export type {
  MediaAsset
} from './models/MediaAsset';

// Form Entry models
export type {
  FormEntry,
  FormEntryMetadata,
  FormEntryStatus
} from './models/FormEntry';

// Form Definition models
export type {
  FormDefinition,
  FormFieldDefinition,
  FormFieldOption,
  FormFieldType,
  FormFieldWidth,
  FormFieldValidation,
  FormSubmitBehavior,
  FormNotificationSettings,
  FormSpamProtection,
  FormCaptchaSettings,
  FormCaptchaMode,
  CaptchaProvider,
  FormRateLimit
} from './models/FormDefinition';

// Page models
export type {
  Page,
  PageMetaData,
  SearchData,
  ContentData,
  SeoData,
  AlternateUrl,
  OpenGraphData,
  TwitterCardData,
  ContentRelationships,
  NodePosition
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
  FaqBlock,
  HubSpokeLink,
  HubSpokesContent,
  HubSpokesLayout,
  HubSpokesBlock
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
  ContactBlock,
  FormBlockContent,
  FormBlock
} from './models/InteractionBlocks';

// Blog blocks
export type {
  RelatedPost,
  BlogContent,
  BlogBlock
} from './models/BlogBlocks';

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

// Theme models
export type {
  Theme,
  ThemeHeader,
  ThemeFooter,
  ThemePreview,
  ThemeTypography,
  ThemeSpacing,
  ThemeBorders,
  ThemeShadows,
  ThemeCompiledAssets,
  ThemeCustomCss,
  ThemeCssRevision,
  BlockStyleMap,
  MenuItem
} from './models/Theme';

// JSON converter
export { PageJsonConverter } from './PageJsonConverter';
export type { JsonConverterOptions } from './PageJsonConverter';
