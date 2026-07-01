import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pumpkin Starter App',
  description: 'Blank Pumpkin CMS tenant starter app.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
