import React from 'react';
import type { IHtmlBlock } from 'pumpkin-ts-models';
import type {
  HeroBlock, PrimaryCtaBlock, SecondaryCtaBlock,
  CardGridBlock, FaqBlock, BreadcrumbsBlock,
  TrustBarBlock, HowItWorksBlock, ServiceAreaMapBlock,
  LocalProTipsBlock, GalleryBlock, TestimonialsBlock,
  ContactBlock, BlogBlock,
} from 'pumpkin-ts-models';

import { HeroBlockView } from './views/HeroBlockView';
import { PrimaryCtaBlockView } from './views/PrimaryCtaBlockView';
import { SecondaryCtaBlockView } from './views/SecondaryCtaBlockView';
import { CardGridBlockView } from './views/CardGridBlockView';
import { FaqBlockView } from './views/FaqBlockView';
import { BreadcrumbsBlockView } from './views/BreadcrumbsBlockView';
import { TrustBarBlockView } from './views/TrustBarBlockView';
import { HowItWorksBlockView } from './views/HowItWorksBlockView';
import { ServiceAreaMapBlockView } from './views/ServiceAreaMapBlockView';
import { LocalProTipsBlockView } from './views/LocalProTipsBlockView';
import { GalleryBlockView } from './views/GalleryBlockView';
import { TestimonialsBlockView } from './views/TestimonialsBlockView';
import { ContactBlockView } from './views/ContactBlockView';
import { BlogBlockView } from './views/BlogBlockView';

import type { HeroClassNames } from './defaults/hero';
import type { PrimaryCtaClassNames } from './defaults/primaryCta';
import type { SecondaryCtaClassNames } from './defaults/secondaryCta';
import type { CardGridClassNames } from './defaults/cardGrid';
import type { FaqClassNames } from './defaults/faq';
import type { BreadcrumbsClassNames } from './defaults/breadcrumbs';
import type { TrustBarClassNames } from './defaults/trustBar';
import type { HowItWorksClassNames } from './defaults/howItWorks';
import type { ServiceAreaMapClassNames } from './defaults/serviceAreaMap';
import type { LocalProTipsClassNames } from './defaults/localProTips';
import type { GalleryClassNames } from './defaults/gallery';
import type { TestimonialsClassNames } from './defaults/testimonials';
import type { ContactClassNames } from './defaults/contact';
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
  Breadcrumbs?: BreadcrumbsClassNames;
  TrustBar?: TrustBarClassNames;
  HowItWorks?: HowItWorksClassNames;
  ServiceAreaMap?: ServiceAreaMapClassNames;
  LocalProTips?: LocalProTipsClassNames;
  Gallery?: GalleryClassNames;
  Testimonials?: TestimonialsClassNames;
  Contact?: ContactClassNames;
  Blog?: BlogClassNames;
}

/**
 * Extra per-block-type props (callbacks, render props, etc.)
 */
export interface BlockOverrides {
  Contact?: {
    onSubmit?: (formData: Record<string, string>) => void;
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

    case 'Contact':
      return (
        <ContactBlockView
          block={block as ContactBlock}
          classNames={classNames?.Contact}
          onSubmit={overrides?.Contact?.onSubmit}
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
