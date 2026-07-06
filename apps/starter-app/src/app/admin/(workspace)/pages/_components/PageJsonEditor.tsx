'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Page } from 'pumpkin-ts-models';

interface PageJsonEditorProps {
  page: Page;
}

export function PageJsonEditor({ page }: PageJsonEditorProps) {
  const router = useRouter();
  const [json, setJson] = useState(() => JSON.stringify(page, null, 2));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setMessage('');
    setError('');
    setSaving(true);

    try {
      const parsed = JSON.parse(json) as Page;
      const response = await fetch(`/api/admin/pages/${encodeSlugPath(page.pageSlug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message || 'Unable to save page.');
      }

      const updated = (await response.json()) as Page;
      setJson(JSON.stringify(updated, null, 2));
      setMessage('Page saved.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save page.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {(message || error) && (
        <p className={[
          'rounded-md border px-3 py-2 text-sm',
          error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700',
        ].join(' ')}>
          {error || message}
        </p>
      )}

      <textarea
        value={json}
        onChange={(event) => setJson(event.target.value)}
        spellCheck={false}
        className="min-h-[560px] w-full rounded-lg border border-neutral-300 bg-neutral-950 p-4 font-mono text-sm leading-6 text-neutral-50 outline-none focus:border-pumpkin-500 focus:ring-2 focus:ring-pumpkin-100"
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex h-10 items-center justify-center rounded-md bg-pumpkin-600 px-4 text-sm font-bold text-white hover:bg-pumpkin-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Page'}
        </button>
      </div>
    </div>
  );
}

function encodeSlugPath(slug: string) {
  return slug.split('/').map((segment) => encodeURIComponent(segment)).join('/');
}
