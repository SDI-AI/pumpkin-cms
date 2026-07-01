import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { createPumpkinThemeStyle, getActivePumpkinTheme } from '@/lib/pumpkin-theme';

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
  const activeTheme = await getActivePumpkinTheme();
  const themeStyle = createPumpkinThemeStyle(activeTheme);

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[var(--pk-color-bg)] text-[var(--pk-color-text)]" style={themeStyle}>
        {children}
      </body>
    </html>
  );
}
