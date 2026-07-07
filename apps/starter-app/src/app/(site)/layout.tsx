import type { FooterClassNames, HeaderClassNames } from 'pumpkin-block-views';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { getSiteTheme } from '@/lib/pumpkin-api';
import { getThemeCssPath } from '@/themes/registry';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const theme = await getSiteTheme();

  return (
    <>
      <link rel="stylesheet" href={getThemeCssPath(theme)} />
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
    </>
  );
}
