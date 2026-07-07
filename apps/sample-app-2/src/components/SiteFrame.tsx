import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { getActivePumpkinTheme, type PumpkinRuntimeTheme } from '@/lib/pumpkin-theme';
import type { HeaderClassNames, FooterClassNames } from 'pumpkin-block-views';

export async function SiteFrame({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme?: PumpkinRuntimeTheme;
}) {
  const activeTheme = theme ?? await getActivePumpkinTheme();

  return (
    <>
      <SiteHeader
        header={activeTheme.header}
        menu={activeTheme.menu}
        classNames={activeTheme.header.classNames as HeaderClassNames}
      />
      <main>{children}</main>
      <SiteFooter
        footer={activeTheme.footer}
        menu={activeTheme.menu}
        logoUrl={activeTheme.header.logoUrl}
        logoAlt={activeTheme.header.logoAlt}
        classNames={activeTheme.footer.classNames as FooterClassNames}
      />
    </>
  );
}
