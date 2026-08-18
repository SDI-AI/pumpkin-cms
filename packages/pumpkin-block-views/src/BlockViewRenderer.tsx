import React from 'react';
import type { IHtmlBlock } from 'pumpkin-ts-models';
import type {
  HeroBlock, PrimaryCtaBlock, SecondaryCtaBlock,
  CardGridBlock, FaqBlock, HubSpokesBlock, BreadcrumbsBlock,
  TrustBarBlock, HowItWorksBlock, ServiceAreaMapBlock,
  LocalProTipsBlock, GalleryBlock, TestimonialsBlock,
  SocialEmbedBlock, SocialLinksBlock, MenuPricingBlock,
  EventPackagesBlock, VideoBlock, HoursLocationBlock,
  ContactBlock, FormBlock, FormDefinition, BlogBlock,
} from 'pumpkin-ts-models';

import { HeroBlockView } from './views/HeroBlockView';
import { PrimaryCtaBlockView } from './views/PrimaryCtaBlockView';
import { SecondaryCtaBlockView } from './views/SecondaryCtaBlockView';
import { CardGridBlockView } from './views/CardGridBlockView';
import { FaqBlockView } from './views/FaqBlockView';
import { HubSpokesBlockView } from './views/HubSpokesBlockView';
import { BreadcrumbsBlockView } from './views/BreadcrumbsBlockView';
import { TrustBarBlockView } from './views/TrustBarBlockView';
import { HowItWorksBlockView } from './views/HowItWorksBlockView';
import { ServiceAreaMapBlockView } from './views/ServiceAreaMapBlockView';
import { LocalProTipsBlockView } from './views/LocalProTipsBlockView';
import { GalleryBlockView } from './views/GalleryBlockView';
import { TestimonialsBlockView } from './views/TestimonialsBlockView';
import { SocialEmbedBlockView } from './views/SocialEmbedBlockView';
import { SocialLinksBlockView } from './views/SocialLinksBlockView';
import { MenuPricingBlockView } from './views/MenuPricingBlockView';
import { EventPackagesBlockView } from './views/EventPackagesBlockView';
import { VideoBlockView } from './views/VideoBlockView';
import { HoursLocationBlockView } from './views/HoursLocationBlockView';
import { ContactBlockView } from './views/ContactBlockView';
import { FormBlockView } from './views/FormBlockView';
import { BlogBlockView } from './views/BlogBlockView';

import type { HeroClassNames } from './defaults/hero';
import type { PrimaryCtaClassNames } from './defaults/primaryCta';
import type { SecondaryCtaClassNames } from './defaults/secondaryCta';
import type { CardGridClassNames } from './defaults/cardGrid';
import type { FaqClassNames } from './defaults/faq';
import type { HubSpokesClassNames } from './defaults/hubSpokes';
import type { BreadcrumbsClassNames } from './defaults/breadcrumbs';
import type { TrustBarClassNames } from './defaults/trustBar';
import type { HowItWorksClassNames } from './defaults/howItWorks';
import type { ServiceAreaMapClassNames } from './defaults/serviceAreaMap';
import type { LocalProTipsClassNames } from './defaults/localProTips';
import type { GalleryClassNames } from './defaults/gallery';
import type { TestimonialsClassNames } from './defaults/testimonials';
import type { SocialEmbedClassNames } from './defaults/socialEmbed';
import type { SocialLinksClassNames } from './defaults/socialLinks';
import type { MenuPricingClassNames } from './defaults/menuPricing';
import type { EventPackagesClassNames } from './defaults/eventPackages';
import type { VideoClassNames } from './defaults/video';
import type { HoursLocationClassNames } from './defaults/hoursLocation';
import type { ContactClassNames } from './defaults/contact';
import type { FormClassNames } from './defaults/form';
import type { BlogClassNames } from './defaults/blog';

/**
 * Per-block-type class name overrides, keyed by the block `type` string.
 */
export interface BlockClassNamesMap {
  Hero?: HeroClassNames;
  PrimaryCTA?: PrimaryCtaClassNames;
  SecondaryCTA?: SecondaryCtaClassNames;
  CardGrid?: CardGridClassNames;
  FAQ?: FaqClassNames;
  HubSpokes?: HubSpokesClassNames;
  Breadcrumbs?: BreadcrumbsClassNames;
  TrustBar?: TrustBarClassNames;
  HowItWorks?: HowItWorksClassNames;
  ServiceAreaMap?: ServiceAreaMapClassNames;
  LocalProTips?: LocalProTipsClassNames;
  Gallery?: GalleryClassNames;
  Testimonials?: TestimonialsClassNames;
  SocialEmbed?: SocialEmbedClassNames;
  SocialLinks?: SocialLinksClassNames;
  MenuPricing?: MenuPricingClassNames;
  EventPackages?: EventPackagesClassNames;
  Video?: VideoClassNames;
  HoursLocation?: HoursLocationClassNames;
  Contact?: ContactClassNames;
  Form?: FormClassNames;
  Blog?: BlogClassNames;
}

/**
 * Extra per-block-type props (callbacks, render props, etc.)
 */
export interface BlockOverrides {
  Contact?: {
    onSubmit?: (formData: Record<string, string>) => void;
  };
  Form?: {
    formDefinition?: FormDefinition;
    pageSlug?: string;
    onSubmit?: (formType: string, formData: Record<string, string>, pageSlug?: string) => Promise<void> | void;
  };
  Blog?: {
    renderBody?: (body: string) => React.ReactNode;
  };
}

export interface BlockViewRendererProps {
  /** The block data to render. */
  block: IHtmlBlock;
  /** Per-block-type classNames overrides. */
  classNames?: BlockClassNamesMap;
  /** Per-block-type extra props (callbacks, render props). */
  overrides?: BlockOverrides;
  /** Rendered when the block type is not recognised. */
  fallback?: React.ReactNode;
}

/**
 * Factory component that renders the correct view for a given block.
 *
 * ```tsx
 * <BlockViewRenderer
 *   block={block}
 *   classNames={{ Hero: { wrapper: 'my-custom-hero' } }}
 *   overrides={{ Contact: { onSubmit: handleSubmit } }}
 * />
 * ```
 */
export function BlockViewRenderer({ block, classNames, overrides, fallback }: BlockViewRendererProps) {
  switch (block.type) {
    case 'Hero':
      return <HeroBlockView block={block as HeroBlock} classNames={classNames?.Hero} />;

    case 'PrimaryCTA':
      return <PrimaryCtaBlockView block={block as PrimaryCtaBlock} classNames={classNames?.PrimaryCTA} />;

    case 'SecondaryCTA':
      return <SecondaryCtaBlockView block={block as SecondaryCtaBlock} classNames={classNames?.SecondaryCTA} />;

    case 'CardGrid':
      return <CardGridBlockView block={block as CardGridBlock} classNames={classNames?.CardGrid} />;

    case 'FAQ':
      return <FaqBlockView block={block as FaqBlock} classNames={classNames?.FAQ} />;

    case 'HubSpokes':
      return <HubSpokesBlockView block={block as HubSpokesBlock} classNames={classNames?.HubSpokes} />;

    case 'Breadcrumbs':
      return <BreadcrumbsBlockView block={block as BreadcrumbsBlock} classNames={classNames?.Breadcrumbs} />;

    case 'TrustBar':
      return <TrustBarBlockView block={block as TrustBarBlock} classNames={classNames?.TrustBar} />;

    case 'HowItWorks':
      return <HowItWorksBlockView block={block as HowItWorksBlock} classNames={classNames?.HowItWorks} />;

    case 'ServiceAreaMap':
      return <ServiceAreaMapBlockView block={block as ServiceAreaMapBlock} classNames={classNames?.ServiceAreaMap} />;

    case 'LocalProTips':
      return <LocalProTipsBlockView block={block as LocalProTipsBlock} classNames={classNames?.LocalProTips} />;

    case 'Gallery':
      return <GalleryBlockView block={block as GalleryBlock} classNames={classNames?.Gallery} />;

    case 'Testimonials':
      return <TestimonialsBlockView block={block as TestimonialsBlock} classNames={classNames?.Testimonials} />;

    case 'SocialEmbed':
      return <SocialEmbedBlockView block={block as SocialEmbedBlock} classNames={classNames?.SocialEmbed} />;

    case 'SocialLinks':
      return <SocialLinksBlockView block={block as SocialLinksBlock} classNames={classNames?.SocialLinks} />;

    case 'MenuPricing':
      return <MenuPricingBlockView block={block as MenuPricingBlock} classNames={classNames?.MenuPricing} />;

    case 'EventPackages':
      return <EventPackagesBlockView block={block as EventPackagesBlock} classNames={classNames?.EventPackages} />;

    case 'Video':
      return <VideoBlockView block={block as VideoBlock} classNames={classNames?.Video} />;

    case 'HoursLocation':
      return <HoursLocationBlockView block={block as HoursLocationBlock} classNames={classNames?.HoursLocation} />;

    case 'Contact':
      return (
        <ContactBlockView
          block={block as ContactBlock}
          classNames={classNames?.Contact}
          onSubmit={overrides?.Contact?.onSubmit}
        />
      );

    case 'Form':
      return (
        <FormBlockView
          block={block as FormBlock}
          classNames={classNames?.Form}
          formDefinition={overrides?.Form?.formDefinition}
          pageSlug={overrides?.Form?.pageSlug}
          onSubmit={overrides?.Form?.onSubmit}
        />
      );

    case 'Blog':
      return (
        <BlogBlockView
          block={block as BlogBlock}
          classNames={classNames?.Blog}
          renderBody={overrides?.Blog?.renderBody}
        />
      );

    default:
      return <>{fallback ?? null}</>;
  }
}
