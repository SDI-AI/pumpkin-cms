import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { fetchTheme } from '@/lib/api';
import { fallbackTheme } from '@/data';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import type { HeaderClassNames, FooterClassNames } from 'pumpkin-block-views';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Pumpkin CMS — Open-Source Headless CMS',
    template: '%s | Pumpkin CMS',
  },
  description:
    'Build modern websites with Pumpkin CMS — an open-source, API-first headless CMS with 14 content blocks, multi-tenant architecture, and Tailwind CSS theming.',
  metadataBase: new URL('https://pumpkincms.dev'),
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = (await fetchTheme()) ?? fallbackTheme;

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-white">
        {/* ── Site Header ──────────────────────────────── */}
        <SiteHeader
          header={theme.header}
          menu={theme.menu}
          classNames={theme.header.classNames as HeaderClassNames}
        />

        {/* ── Main Content ─────────────────────────────── */}
        <main>{children}</main>

        {/* ── Site Footer ──────────────────────────────── */}
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
