import type { Theme } from 'pumpkin-ts-models';
import { fallbackTheme } from '@/data';

const THEME_CSS_PATHS: Record<string, string> = {
  pumpkin: '/themes/pumpkin-default.css',
  'pumpkin-default': '/themes/pumpkin-default.css',
};

const DEFAULT_THEME_CSS_PATH = '/themes/pumpkin-default.css';

export interface ThemeStylesheet {
  href: string;
  integrity?: string;
  crossOrigin?: 'anonymous';
}

export function getThemeStylesheet(theme: Theme): ThemeStylesheet {
  const extendedTheme = theme as Theme & {
    themeCss?: string;
    themeCssPath?: string;
    cssPath?: string;
  };
  const compiledAssets = theme.compiledAssets;

  const href = (
    normalizeCssPath(compiledAssets?.cssUrl) ||
    normalizeCssPath(extendedTheme.themeCss) ||
    normalizeCssPath(extendedTheme.themeCssPath) ||
    normalizeCssPath(extendedTheme.cssPath) ||
    THEME_CSS_PATHS[theme.themeId] ||
    DEFAULT_THEME_CSS_PATH
  );
  const integrity = shouldUseStylesheetIntegrity(href)
    ? normalizeCssPath(compiledAssets?.cssIntegrity)
    : undefined;

  return {
    href,
    integrity,
  };
}

export function getThemeCssPath(theme: Theme) {
  return getThemeStylesheet(theme).href;
}

export function resolveThemePlugin(theme: Theme): Theme {
  if (theme.themeId !== 'pumpkin-default' && theme.themeId !== 'pumpkin') {
    return theme;
  }

  return {
    ...theme,
    header: {
      ...theme.header,
      classNames: fallbackTheme.header.classNames,
    },
    footer: {
      ...theme.footer,
      classNames: fallbackTheme.footer.classNames,
    },
    blockStyles: fallbackTheme.blockStyles,
  };
}

function normalizeCssPath(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function shouldUseStylesheetIntegrity(href: string) {
  return href.startsWith('/');
}
