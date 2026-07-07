import Link from 'next/link';
import { FileText, GitBranch, Menu, Paintbrush } from 'lucide-react';

const cards = [
  {
    href: '/admin/themes',
    title: 'Theme Studio',
    text: 'Edit Pumpkin runtime tokens, header/footer slot classes, and block style presets.',
    icon: Paintbrush,
  },
  {
    href: '/admin/navigation',
    title: 'Header, Footer, Menu',
    text: 'Manage brand data, CTA links, footer copy, and the recursive main menu.',
    icon: Menu,
  },
  {
    href: '/admin/pages',
    title: 'Page CRUD',
    text: 'Create and edit tenant pages using Pumpkin page models and content blocks.',
    icon: FileText,
  },
  {
    href: '/admin/page-map',
    title: 'Page Map',
    text: 'Visualize hub, spoke, related-hub, and orphaned page relationships.',
    icon: GitBranch,
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-neutral-950">Site Builder</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-600">
          This app is the tenant starter surface for Pumpkin CMS: public site rendering, runtime theming, and admin-first content operations in one Next.js instance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:shadow-md"
            >
              <Icon className="h-5 w-5 text-orange-600" aria-hidden="true" />
              <h3 className="mt-4 text-base font-black text-neutral-950">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{card.text}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
