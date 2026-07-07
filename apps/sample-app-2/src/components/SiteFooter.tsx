'use client';

import React from 'react';
import type { ThemeFooter, MenuItem } from 'pumpkin-ts-models';
import type { FooterClassNames } from 'pumpkin-block-views';
import { FooterView } from 'pumpkin-block-views';

interface SiteFooterProps {
  footer: ThemeFooter;
  menu: MenuItem[];
  logoUrl?: string;
  logoAlt?: string;
  classNames?: FooterClassNames;
}

/**
 * Client wrapper around FooterView.
 * Receives serialisable theme data from the server layout.
 */
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
