import type { Theme } from 'pumpkin-ts-models';
import { fallbackTheme } from '@/data';

const THEME_CSS_PATHS: Record<string, string> = {
  pumpkin: '/themes/pumpkin-default.css',
  'pumpkin-default': '/themes/pumpkin-default.css',
};

export function getThemeCssPath(theme: Theme) {
  const extendedTheme = theme as Theme & {
    themeCss?: string;
    themeCssPath?: string;
    cssPath?: string;
  };

  return (
    extendedTheme.themeCss ||
    extendedTheme.themeCssPath ||
    extendedTheme.cssPath ||
    THEME_CSS_PATHS[theme.themeId] ||
    `/themes/${theme.themeId}.css`
  );
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
