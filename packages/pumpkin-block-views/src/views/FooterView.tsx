import React from 'react';
import type { ThemeFooter, MenuItem } from 'pumpkin-ts-models';
import { footerDefaults, type FooterClassNames } from '../defaults/footer';
import { mergeClasses } from '../utils/mergeClasses';

export interface FooterViewProps {
  footer: ThemeFooter;
  menu: MenuItem[];
  /** Logo URL or emoji – reused from the header's logoUrl. */
  logoUrl?: string;
  /** Logo alt / site name – reused from the header's logoAlt. */
  logoAlt?: string;
  classNames?: FooterClassNames;
}

/** Returns true when the string looks like an emoji (single grapheme cluster). */
function isEmoji(s: string): boolean {
  return /^\p{Emoji_Presentation}$/u.test(s.trim());
}

export function FooterView({ footer, menu, logoUrl, logoAlt, classNames }: FooterViewProps) {
  const cx = mergeClasses(footerDefaults, classNames);

  // Visible, sorted top-level items that have children become footer columns
  const columns = menu
    .filter((m) => m.isVisible && (m.children || []).length > 0)
    .sort((a, b) => a.order - b.order);

  // Replace {year} placeholder in copyright string
  const copyrightText = (footer.copyright || '').replace(
    /\{year\}/gi,
    String(new Date().getFullYear()),
  );

  return (
    <footer className={cx.root}>
      <div className={cx.container}>
        <div className={cx.topSection}>
          {/* Brand column */}
          <div className={cx.brandSection}>
            <div className={cx.brandLogoWrapper}>
              {logoUrl && isEmoji(logoUrl) ? (
                <span className={cx.brandLogoIcon} role="img" aria-label={logoAlt || ''}>
                  {logoUrl}
                </span>
              ) : logoUrl ? (
                <img src={logoUrl} alt={logoAlt || ''} className={cx.brandLogoImage} />
              ) : null}
              {logoAlt && <span className={cx.brandLogoText}>{logoAlt}</span>}
            </div>
            {footer.description && (
              <p className={cx.brandDescription}>{footer.description}</p>
            )}
          </div>

          {/* Link columns from menu items with children */}
          <div className={cx.columnsSection}>
            {columns.map((col) => (
              <div key={col.label}>
                <h4 className={cx.columnTitle}>{col.label}</h4>
                <ul className={cx.columnList}>
                  {(col.children || [])
                    .filter((c) => c.isVisible)
                    .sort((a, b) => a.order - b.order)
                    .map((child) => (
                      <li key={child.label}>
                        <a
                          href={child.url}
                          target={child.target || '_self'}
                          className={cx.columnLink}
                        >
                          {child.label}
                        </a>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className={cx.bottomBar}>
          <div className={cx.bottomBarInner}>
            {copyrightText && <span className={cx.copyright}>{copyrightText}</span>}
            <a
              href="https://github.com/pumpkin-cms"
              target="_blank"
              rel="noopener noreferrer"
              className={cx.builtWith}
            >
              Built with Pumpkin CMS
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
