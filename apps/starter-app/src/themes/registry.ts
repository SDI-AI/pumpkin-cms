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
  const configuredIntegrity = normalizeCssPath(compiledAssets?.cssIntegrity);
  // Cross-origin SRI requires the stylesheet host to return an approved CORS
  // response. Public tenant theme blobs currently do not provide that contract,
  // so browsers reject otherwise valid CSS when integrity is attached.
  const integrity = isSameOriginPath(href) ? configuredIntegrity : undefined;

  return {
    href,
    integrity,
    crossOrigin: integrity ? 'anonymous' : undefined,
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

function isSameOriginPath(href: string) {
  return href.startsWith('/') && !href.startsWith('//');
}

