import type { Metadata } from 'next';
import { loadTenantConfig } from '@/lib/tenant-config';
import './globals.css';

export function generateMetadata(): Metadata {
  const siteName = loadTenantConfig()?.siteName || 'Pumpkin CMS';

  return {
    title: siteName,
    description: `${siteName} website powered by Pumpkin CMS.`,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
