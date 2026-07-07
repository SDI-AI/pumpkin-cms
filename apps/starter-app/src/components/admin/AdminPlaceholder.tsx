import { ArrowRight } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

interface AdminPlaceholderProps {
  title: string;
  description: string;
  nextPhase: string;
  items: string[];
}

export function AdminPlaceholder({ title, description, nextPhase, items }: AdminPlaceholderProps) {
  return (
    <section>
      <AdminPageHeader eyebrow={nextPhase} title={title} description={description} />
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-950">Planned migration points</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4">
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-pumpkin-600" aria-hidden="true" />
              <p className="text-sm leading-5 text-neutral-700">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
