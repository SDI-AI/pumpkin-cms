'use client';

import type { HeaderClassNames } from 'pumpkin-block-views';
import { HeaderView } from 'pumpkin-block-views';
import type { MenuItem, ThemeHeader } from 'pumpkin-ts-models';

interface SiteHeaderProps {
  header: ThemeHeader;
  menu: MenuItem[];
  classNames?: HeaderClassNames;
}

export function SiteHeader({ header, menu, classNames }: SiteHeaderProps) {
  return <HeaderView header={header} menu={menu} classNames={classNames} />;
}
