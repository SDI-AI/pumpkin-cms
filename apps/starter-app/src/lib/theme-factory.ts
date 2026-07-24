import type { Theme } from 'pumpkin-ts-models';
import { fallbackTheme } from '@/data';

export function createTheme(tenantId: string): Theme {
  const now = new Date().toISOString();

  return {
    id: 'new-theme',
    themeId: 'new-theme',
    tenantId,
    name: 'New Theme',
    label: 'New Theme',
    description: '',
    category: 'custom',
    tags: [],
    isActive: false,
    isSystem: false,
    isCustom: true,
    createdByUserId: '',
    version: 1,
    preview: {
      palette: ['#f97316', '#111827', '#f8fafc', '#0f766e'],
      background: '#ffffff',
      foreground: '#111827',
      primary: '#f97316',
      accent: '#0f766e',
    },
    cssVariables: {
      '--color-background': '#ffffff',
      '--color-foreground': '#111827',
      '--color-primary': '#f97316',
      '--color-accent': '#0f766e',
    },
    typography: {
      fontSans: 'Inter, ui-sans-serif, system-ui',
      fontSerif: 'Georgia, serif',
      fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      headingFont: 'Inter, ui-sans-serif, system-ui',
      bodyFont: 'Inter, ui-sans-serif, system-ui',
      baseFontSize: '16px',
      lineHeight: '1.5',
      fontWeights: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
    spacing: {
      baseUnit: '4px',
      scale: { xs: '0.5rem', sm: '0.75rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
    },
    borders: {
      radius: { sm: '4px', md: '6px', lg: '8px' },
      width: { thin: '1px', thick: '2px' },
      style: 'solid',
    },
    shadows: {
      scale: {
        sm: '0 1px 2px rgb(15 23 42 / 0.08)',
        md: '0 8px 24px rgb(15 23 42 / 0.10)',
      },
    },
    header: {
      ...fallbackTheme.header,
      logoUrl: '',
      logoAlt: '',
      sticky: false,
      ctaText: '',
      ctaUrl: '',
      ctaTarget: '_self',
    },
    footer: {
      ...fallbackTheme.footer,
      copyright: '',
      description: '',
    },
    blockStyles: fallbackTheme.blockStyles,
    menu: fallbackTheme.menu,
    createdAt: now,
    updatedAt: now,
  };
}
