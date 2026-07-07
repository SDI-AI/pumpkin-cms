import type { CSSProperties } from 'react';
import type { BlockStyleMap, Theme } from 'pumpkin-ts-models';
import { siteTheme as staticTheme } from '@/data/fallback-theme';
import { fetchActiveTheme } from '@/lib/api';

export interface PumpkinThemeTokens {
  colorBackground?: string;
  colorSurface?: string;
  colorSurfaceMuted?: string;
  colorText?: string;
  colorTextMuted?: string;
  colorBorder?: string;
  colorPrimary?: string;
  colorPrimaryHover?: string;
  colorPrimaryText?: string;
  colorAccent?: string;
  radiusSm?: string;
  radiusMd?: string;
  radiusLg?: string;
  shadowSm?: string;
  shadowMd?: string;
  maxWidth?: string;
}

export interface PumpkinRuntimeTheme extends Theme {
  /**
   * Runtime-safe design tokens. These are preferred over tenant-authored
   * arbitrary Tailwind classes because they do not depend on Tailwind rebuilds.
   */
  tokens?: PumpkinThemeTokens;
}

export const defaultPumpkinTokens: Required<PumpkinThemeTokens> = {
  colorBackground: '#ffffff',
  colorSurface: '#ffffff',
  colorSurfaceMuted: '#f8fafc',
  colorText: '#171717',
  colorTextMuted: '#525252',
  colorBorder: '#e5e5e5',
  colorPrimary: '#f97316',
  colorPrimaryHover: '#ea580c',
  colorPrimaryText: '#ffffff',
  colorAccent: '#16a34a',
  radiusSm: '6px',
  radiusMd: '8px',
  radiusLg: '12px',
  shadowSm: '0 1px 2px rgb(15 23 42 / 0.08)',
  shadowMd: '0 8px 24px rgb(15 23 42 / 0.12)',
  maxWidth: '72rem',
};

const runtimeHeaderClassNames = {
  root: 'pk-site-header',
  container: 'pk-site-header__container',
  logoWrapper: 'pk-site-header__logo',
  logoIcon: 'pk-site-header__logo-icon',
  logoImage: 'pk-site-header__logo-image',
  logoText: 'pk-site-header__logo-text',
  nav: 'pk-site-header__nav',
  navLink: 'pk-site-header__nav-link',
  navLinkActive: 'pk-site-header__nav-link pk-is-active',
  navDropdown: 'pk-site-header__dropdown',
  navDropdownTrigger: 'pk-site-header__nav-link pk-site-header__dropdown-trigger',
  navDropdownArrow: 'pk-site-header__dropdown-arrow',
  navDropdownArrowOpen: 'pk-site-header__dropdown-arrow pk-is-open',
  navDropdownMenu: 'pk-site-header__dropdown-menu',
  navDropdownItem: 'pk-site-header__dropdown-item',
  ctaButton: 'pk-button pk-button--primary',
  mobileToggle: 'pk-site-header__mobile-toggle',
  mobileMenu: 'pk-site-header__mobile-menu',
  mobileLink: 'pk-site-header__mobile-link',
  mobileDropdownTrigger: 'pk-site-header__mobile-dropdown-trigger',
  mobileDropdownArrow: 'pk-site-header__dropdown-arrow',
  mobileDropdownArrowOpen: 'pk-site-header__dropdown-arrow pk-is-open',
  mobileSubMenu: 'pk-site-header__mobile-submenu',
  mobileSubLink: 'pk-site-header__mobile-sublink',
  mobileCta: 'pk-button pk-button--primary pk-site-header__mobile-cta',
};

const runtimeFooterClassNames = {
  root: 'pk-site-footer',
  container: 'pk-site-footer__container',
  topSection: 'pk-site-footer__top',
  brandSection: 'pk-site-footer__brand',
  brandLogoWrapper: 'pk-site-footer__brand-logo',
  brandLogoIcon: 'pk-site-footer__brand-logo-icon',
  brandLogoImage: 'pk-site-footer__brand-logo-image',
  brandLogoText: 'pk-site-footer__brand-logo-text',
  brandDescription: 'pk-site-footer__description',
  columnsSection: 'pk-site-footer__columns',
  columnTitle: 'pk-site-footer__column-title',
  columnList: 'pk-site-footer__column-list',
  columnLink: 'pk-site-footer__column-link',
  bottomBar: 'pk-site-footer__bottom',
  bottomBarInner: 'pk-site-footer__bottom-inner',
  copyright: 'pk-site-footer__copyright',
  builtWith: 'pk-site-footer__built-with',
};

const runtimeBlockStyles: BlockStyleMap = {
  Hero: {
    root: 'pk-hero',
    overlay: 'pk-hero__overlay',
    container: 'pk-hero__container',
    headline: 'pk-hero__headline',
    subheadline: 'pk-hero__subheadline',
    mainImage: 'pk-hero__image',
    button: 'pk-button pk-button--primary pk-hero__button',
  },
  CardGrid: {
    root: 'pk-section',
    container: 'pk-container',
    header: 'pk-section-header',
    title: 'pk-section-title',
    subtitle: 'pk-section-subtitle',
    grid: 'pk-card-grid',
    card: 'pk-card',
    cardImage: 'pk-card__image',
    cardBody: 'pk-card__body',
    cardIcon: 'pk-card__icon',
    cardTitle: 'pk-card__title',
    cardDescription: 'pk-card__description',
    cardLink: 'pk-link',
  },
  FAQ: {
    root: 'pk-section pk-section--muted',
    container: 'pk-container pk-container--narrow',
    header: 'pk-section-header',
    title: 'pk-section-title',
    subtitle: 'pk-section-subtitle',
    list: 'pk-stack',
    item: 'pk-accordion',
    question: 'pk-accordion__question',
    questionIcon: 'pk-accordion__icon',
    answer: 'pk-accordion__answer',
  },
  Contact: {
    root: 'pk-section',
    container: 'pk-contact',
    infoSection: 'pk-contact__info',
    title: 'pk-section-title',
    subtitle: 'pk-section-subtitle',
    infoItem: 'pk-contact__item',
    infoLabel: 'pk-contact__label',
    infoValue: 'pk-contact__value',
    socialLinks: 'pk-contact__socials',
    socialLink: 'pk-contact__social-link',
    form: 'pk-form',
    fieldWrapper: 'pk-form__field',
    fieldLabel: 'pk-form__label',
    fieldInput: 'pk-form__input',
    fieldTextarea: 'pk-form__textarea',
    submitButton: 'pk-button pk-button--primary pk-form__submit',
  },
  PrimaryCTA: {
    root: 'pk-cta',
    overlay: 'pk-cta__overlay',
    container: 'pk-cta__container',
    textWrapper: 'pk-cta__text',
    title: 'pk-cta__title',
    description: 'pk-cta__description',
    button: 'pk-button pk-button--primary',
    secondaryWrapper: 'pk-cta__secondary',
    secondaryLink: 'pk-link pk-link--on-primary',
    mainImage: 'pk-cta__image',
  },
  SecondaryCTA: {
    root: 'pk-section pk-section--muted',
    container: 'pk-container pk-container--narrow pk-center',
    title: 'pk-section-title',
    description: 'pk-section-subtitle',
    button: 'pk-button pk-button--primary',
  },
};

export async function getActivePumpkinTheme(): Promise<PumpkinRuntimeTheme> {
  const activeTheme = await fetchActiveTheme();
  return withRuntimeDefaults((activeTheme ?? staticTheme) as PumpkinRuntimeTheme);
}

export function withRuntimeDefaults(theme: PumpkinRuntimeTheme): PumpkinRuntimeTheme {
  return {
    ...theme,
    tokens: {
      ...defaultPumpkinTokens,
      ...(theme.tokens ?? {}),
    },
    header: {
      ...theme.header,
      classNames: {
        ...runtimeHeaderClassNames,
        ...(theme.header?.classNames ?? {}),
      },
    },
    footer: {
      ...theme.footer,
      classNames: {
        ...runtimeFooterClassNames,
        ...(theme.footer?.classNames ?? {}),
      },
    },
    blockStyles: {
      ...runtimeBlockStyles,
      ...(theme.blockStyles ?? {}),
    },
  };
}

export function createPumpkinThemeStyle(theme: PumpkinRuntimeTheme): CSSProperties {
  const tokens = {
    ...defaultPumpkinTokens,
    ...(theme.tokens ?? {}),
  };

  return {
    '--pk-color-bg': tokens.colorBackground,
    '--pk-color-surface': tokens.colorSurface,
    '--pk-color-surface-muted': tokens.colorSurfaceMuted,
    '--pk-color-text': tokens.colorText,
    '--pk-color-text-muted': tokens.colorTextMuted,
    '--pk-color-border': tokens.colorBorder,
    '--pk-color-primary': tokens.colorPrimary,
    '--pk-color-primary-hover': tokens.colorPrimaryHover,
    '--pk-color-primary-text': tokens.colorPrimaryText,
    '--pk-color-accent': tokens.colorAccent,
    '--pk-radius-sm': tokens.radiusSm,
    '--pk-radius-md': tokens.radiusMd,
    '--pk-radius-lg': tokens.radiusLg,
    '--pk-shadow-sm': tokens.shadowSm,
    '--pk-shadow-md': tokens.shadowMd,
    '--pk-max-width': tokens.maxWidth,
  } as CSSProperties;
}
