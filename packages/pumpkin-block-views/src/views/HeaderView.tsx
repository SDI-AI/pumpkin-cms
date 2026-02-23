import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ThemeHeader, MenuItem } from 'pumpkin-ts-models';
import { headerDefaults, type HeaderClassNames } from '../defaults/header';
import { mergeClasses } from '../utils/mergeClasses';

export interface HeaderViewProps {
  header: ThemeHeader;
  menu: MenuItem[];
  currentPath?: string;
  classNames?: HeaderClassNames;
}

/** Returns true when the string looks like an emoji (single grapheme cluster). */
function isEmoji(s: string): boolean {
  return /^\p{Emoji_Presentation}$/u.test(s.trim());
}

/** Chevron-down SVG used for dropdown arrows. */
function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function HeaderView({ header, menu, currentPath, classNames }: HeaderViewProps) {
  const cx = mergeClasses(headerDefaults, classNames);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Close desktop dropdown when clicking outside
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (navRef.current && !navRef.current.contains(e.target as Node)) {
      setOpenDropdown(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  // Filter to visible + sorted menu items
  const items = menu
    .filter((m) => m.isVisible)
    .sort((a, b) => a.order - b.order);

  const renderLogo = () => (
    <a href="/" className={cx.logoWrapper}>
      {header.logoUrl && isEmoji(header.logoUrl) ? (
        <span className={cx.logoIcon} role="img" aria-label={header.logoAlt}>
          {header.logoUrl}
        </span>
      ) : header.logoUrl ? (
        <img src={header.logoUrl} alt={header.logoAlt} className={cx.logoImage} />
      ) : null}
      {header.logoAlt && <span className={cx.logoText}>{header.logoAlt}</span>}
    </a>
  );

  const isActive = (url: string) => currentPath === url;

  // Build the root className — only add sticky classes if they aren't already in cx.root
  const rootClassName = header.sticky && !cx.root.includes('sticky')
    ? `${cx.root} sticky top-0 z-40`
    : cx.root;

  return (
    <header className={rootClassName}>
      <div className={cx.container}>
        {renderLogo()}

        {/* Desktop nav */}
        <nav ref={navRef} className={cx.nav}>
          {items.map((item) => {
            const children = (item.children || [])
              .filter((c: MenuItem) => c.isVisible)
              .sort((a: MenuItem, b: MenuItem) => a.order - b.order);

            if (children.length > 0) {
              const isOpen = openDropdown === item.label;
              return (
                <div key={item.label} className={cx.navDropdown}>
                  <button
                    type="button"
                    className={cx.navDropdownTrigger}
                    aria-expanded={isOpen}
                    onClick={() => setOpenDropdown(isOpen ? null : item.label)}
                  >
                    {item.label}
                    <ChevronDown className={isOpen ? cx.navDropdownArrowOpen : cx.navDropdownArrow} />
                  </button>
                  {isOpen && (
                    <div className={cx.navDropdownMenu}>
                      {children.map((child: MenuItem) => (
                        <a
                          key={child.label}
                          href={child.url}
                          target={child.target || '_self'}
                          className={cx.navDropdownItem}
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <a
                key={item.label}
                href={item.url}
                target={item.target || '_self'}
                className={isActive(item.url) ? cx.navLinkActive : cx.navLink}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Desktop CTA */}
        {header.ctaText && (
          <a href={header.ctaUrl} target={header.ctaTarget || '_self'} className={cx.ctaButton}>
            {header.ctaText}
          </a>
        )}

        {/* Mobile toggle */}
        <button
          type="button"
          className={cx.mobileToggle}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => { setMobileOpen((o) => !o); setOpenMobileDropdown(null); }}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className={cx.mobileMenu}>
          {items.map((item) => {
            const children = (item.children || [])
              .filter((c: MenuItem) => c.isVisible)
              .sort((a: MenuItem, b: MenuItem) => a.order - b.order);

            if (children.length > 0) {
              const isSubOpen = openMobileDropdown === item.label;
              return (
                <div key={item.label}>
                  <button
                    type="button"
                    className={cx.mobileDropdownTrigger}
                    aria-expanded={isSubOpen}
                    onClick={() => setOpenMobileDropdown(isSubOpen ? null : item.label)}
                  >
                    {item.label}
                    <ChevronDown className={isSubOpen ? cx.mobileDropdownArrowOpen : cx.mobileDropdownArrow} />
                  </button>
                  {isSubOpen && (
                    <div className={cx.mobileSubMenu}>
                      {children.map((child: MenuItem) => (
                        <a
                          key={child.label}
                          href={child.url}
                          target={child.target || '_self'}
                          className={cx.mobileSubLink}
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <a key={item.label} href={item.url} target={item.target || '_self'} className={cx.mobileLink}>
                {item.label}
              </a>
            );
          })}
          {header.ctaText && (
            <a href={header.ctaUrl} target={header.ctaTarget || '_self'} className={cx.mobileCta}>
              {header.ctaText}
            </a>
          )}
        </nav>
      )}
    </header>
  );
}
