import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Pumpkin CMS',
    template: '%s | Pumpkin CMS',
  },
  description: 'An API-first, block-based CMS for fast tenant websites.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
