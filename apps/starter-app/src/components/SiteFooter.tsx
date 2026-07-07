'use client';

import type { FooterClassNames } from 'pumpkin-block-views';
import { FooterView } from 'pumpkin-block-views';
import type { MenuItem, ThemeFooter } from 'pumpkin-ts-models';

interface SiteFooterProps {
  footer: ThemeFooter;
  menu: MenuItem[];
  logoUrl?: string;
  logoAlt?: string;
  classNames?: FooterClassNames;
}

export function SiteFooter({ footer, menu, logoUrl, logoAlt, classNames }: SiteFooterProps) {
  return (
    <FooterView
      footer={footer}
      menu={menu}
      logoUrl={logoUrl}
      logoAlt={logoAlt}
      classNames={classNames}
    />
  );
}
