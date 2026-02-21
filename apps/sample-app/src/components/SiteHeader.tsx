'use client';

import React from 'react';
import type { ThemeHeader, MenuItem } from 'pumpkin-ts-models';
import type { HeaderClassNames } from 'pumpkin-block-views';
import { HeaderView } from 'pumpkin-block-views';

interface SiteHeaderProps {
  header: ThemeHeader;
  menu: MenuItem[];
  classNames?: HeaderClassNames;
}

/**
 * Client wrapper around HeaderView (which uses useState for the mobile menu).
 * Receives serialisable theme data from the server layout.
 */
export function SiteHeader({ header, menu, classNames }: SiteHeaderProps) {
  return <HeaderView header={header} menu={menu} classNames={classNames} />;
}
