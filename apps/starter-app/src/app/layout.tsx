import type { Metadata } from 'next';
import type { FooterClassNames, HeaderClassNames } from 'pumpkin-block-views';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { getSiteTheme } from '@/lib/pumpkin-api';
import { getThemeCssPath } from '@/themes/registry';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Pumpkin CMS',
    template: '%s | Pumpkin CMS',
  },
  description: 'An API-first, block-based CMS for fast tenant websites.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getSiteTheme();

  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href={getThemeCssPath(theme)} />
      </head>
      <body>
        <SiteHeader
          header={theme.header}
          menu={theme.menu}
          classNames={theme.header.classNames as HeaderClassNames}
        />
        <main>{children}</main>
        <SiteFooter
          footer={theme.footer}
          menu={theme.menu}
          logoUrl={theme.header.logoUrl}
          logoAlt={theme.header.logoAlt}
          classNames={theme.footer.classNames as FooterClassNames}
        />
      </body>
    </html>
  );
}
