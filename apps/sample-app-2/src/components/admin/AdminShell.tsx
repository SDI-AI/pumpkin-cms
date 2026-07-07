'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, GitBranch, LayoutDashboard, Menu, Paintbrush, Settings } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/themes', label: 'Themes', icon: Paintbrush },
  { href: '/admin/navigation', label: 'Navigation', icon: Menu },
  { href: '/admin/pages', label: 'Pages', icon: FileText },
  { href: '/admin/page-map', label: 'Page Map', icon: GitBranch },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-neutral-200 bg-white lg:block">
        <div className="flex h-16 items-center border-b border-neutral-200 px-5">
          <Link href="/admin" className="text-lg font-black tracking-normal text-neutral-950">
            Pumpkin Admin
          </Link>
        </div>
        <nav className="grid gap-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase text-neutral-500">Tenant Builder</p>
            <h1 className="text-base font-black text-neutral-950">Pumpkin CMS Site Instance</h1>
          </div>
          <Link
            href="/"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            View Site
          </Link>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
