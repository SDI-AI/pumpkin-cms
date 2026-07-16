'use client';

import { useMemo, useState } from 'react';
import { Eye, Inbox, RefreshCw, Search } from 'lucide-react';
import type { FormEntry, FormEntryStatus } from 'pumpkin-ts-models';

const statuses: FormEntryStatus[] = ['new', 'read', 'actioned', 'archived'];

interface FormEntriesManagerProps {
  initialEntries: FormEntry[];
}

export function FormEntriesManager({ initialEntries }: FormEntriesManagerProps) {
  const [entries, setEntries] = useState(() => sortEntries(initialEntries));
  const [selectedId, setSelectedId] = useState(initialEntries[0]?.id || '');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const types = useMemo(
    () => [...new Set(entries.map((entry) => entry.type).filter(Boolean))].sort(),
    [entries],
  );
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (statusFilter !== 'all' && entry.status !== statusFilter) return false;
      if (typeFilter !== 'all' && entry.type !== typeFilter) return false;
      if (!normalized) return true;
      return [
        entry.id,
        entry.type,
        entry.source,
        entry.pageSlug,
        JSON.stringify(entry.formData),
      ].join(' ').toLowerCase().includes(normalized);
    });
  }, [entries, query, statusFilter, typeFilter]);
  const selected = entries.find((entry) => entry.id === selectedId) || null;

  const refresh = async () => {
    setRefreshing(true);
    setError('');
    try {
      const response = await fetch('/api/admin/forms/entries', { cache: 'no-store' });
      const data = await response.json().catch(() => null) as { entries?: FormEntry[]; message?: string } | null;
      if (!response.ok) throw new Error(data?.message || 'Unable to refresh entries.');
      const nextEntries = sortEntries(data?.entries ?? []);
      setEntries(nextEntries);
      if (!nextEntries.some((entry) => entry.id === selectedId)) {
        setSelectedId(nextEntries[0]?.id || '');
      }
      setMessage('Entries refreshed.');
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Unable to refresh entries.');
    } finally {
      setRefreshing(false);
    }
  };

  const updateStatus = async (status: FormEntryStatus) => {
    if (!selected || selected.status === status) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/admin/forms/entries/${encodeURIComponent(selected.id)}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => null) as FormEntry | { message?: string } | null;
      if (!response.ok || !data || !('id' in data)) {
        throw new Error(data && 'message' in data ? data.message : 'Unable to update entry status.');
      }
      setEntries((current) => current.map((entry) => entry.id === data.id ? data : entry));
      setMessage(`Marked as ${status}.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update entry status.');
    } finally {
      setSaving(false);
    }
  };

  const counts = Object.fromEntries(statuses.map((status) => [
    status,
    entries.filter((entry) => entry.status === status).length,
  ]));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statuses.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            className={[
              'rounded-lg border bg-white p-4 text-left shadow-sm transition',
              statusFilter === status ? 'border-pumpkin-500 ring-2 ring-pumpkin-100' : 'border-neutral-200 hover:border-neutral-300',
            ].join(' ')}
          >
            <span className="text-xs font-bold uppercase tracking-wide text-neutral-500">{status}</span>
            <span className="mt-1 block text-2xl font-bold text-neutral-950">{counts[status] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search submissions or field values" className="h-10 w-full rounded-md border border-neutral-300 px-3 pl-9 text-sm outline-none focus:border-pumpkin-500 focus:ring-2 focus:ring-pumpkin-100" />
          </div>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm">
            <option value="all">All form types</option>
            {types.map((type) => <option key={type} value={type}>{humanize(type)}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm">
            <option value="all">All statuses</option>
            {statuses.map((status) => <option key={status} value={status}>{humanize(status)}</option>)}
          </select>
          <button type="button" onClick={refresh} disabled={refreshing} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-neutral-300 px-3 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        {(message || error) && <p className={`mt-3 text-sm font-medium ${error ? 'text-red-700' : 'text-emerald-700'}`}>{error || message}</p>}
      </div>

      <div className="grid min-h-[34rem] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm lg:grid-cols-[minmax(20rem,0.85fr)_minmax(0,1.5fr)]">
        <div className="border-b border-neutral-200 lg:border-b-0 lg:border-r">
          <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
          </div>
          <div className="max-h-[42rem] overflow-y-auto">
            {filtered.length === 0 ? (
              <EmptyState />
            ) : filtered.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => { setSelectedId(entry.id); setMessage(''); setError(''); }}
                className={[
                  'block w-full border-b border-neutral-100 p-4 text-left hover:bg-neutral-50',
                  selectedId === entry.id ? 'bg-pumpkin-50' : 'bg-white',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-neutral-950">{entryTitle(entry)}</p>
                    <p className="mt-1 truncate text-xs text-neutral-500">{humanize(entry.type)} · {formatDate(entry.submittedAt)}</p>
                  </div>
                  <StatusBadge status={entry.status} />
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-neutral-600">{entrySummary(entry)}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="min-w-0">
          {selected ? (
            <EntryDetail entry={selected} saving={saving} onStatusChange={updateStatus} />
          ) : (
            <div className="flex h-full min-h-80 items-center justify-center p-8 text-center text-sm text-neutral-500">
              Select an entry to review its submission.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EntryDetail({ entry, saving, onStatusChange }: { entry: FormEntry; saving: boolean; onStatusChange: (status: FormEntryStatus) => void }) {
  return (
    <article>
      <header className="border-b border-neutral-200 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2"><Eye className="h-4 w-4 text-pumpkin-600" /><p className="text-xs font-bold uppercase tracking-wide text-pumpkin-700">Submission detail</p></div>
            <h2 className="mt-2 text-xl font-bold text-neutral-950">{entryTitle(entry)}</h2>
            <p className="mt-1 text-sm text-neutral-500">{formatDate(entry.submittedAt)} · {humanize(entry.type)}</p>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-neutral-600">Status</span>
            <select disabled={saving} value={knownStatus(entry.status)} onChange={(event) => onStatusChange(event.target.value as FormEntryStatus)} className="h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm font-semibold disabled:opacity-60">
              {statuses.map((status) => <option key={status} value={status}>{humanize(status)}</option>)}
            </select>
          </label>
        </div>
      </header>

      <div className="space-y-6 p-5">
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Submitted fields</h3>
          <dl className="mt-3 divide-y divide-neutral-100 rounded-md border border-neutral-200">
            {Object.entries(entry.formData || {}).map(([key, value]) => (
              <div key={key} className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
                <dt className="text-xs font-semibold text-neutral-500">{humanize(key)}</dt>
                <dd className="min-w-0 whitespace-pre-wrap break-words text-sm text-neutral-900">{formatValue(value)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">Submission context</h3>
          <dl className="mt-3 grid gap-3 rounded-md bg-neutral-50 p-4 sm:grid-cols-2">
            <Detail label="Entry ID" value={entry.id} />
            <Detail label="Source" value={entry.source} />
            <Detail label="Page" value={entry.pageSlug} />
            <Detail label="IP address" value={entry.ipAddress} />
            <Detail label="Referrer" value={entry.metadata?.referrer} />
            <Detail label="Campaign" value={entry.metadata?.utmCampaign} />
          </dl>
        </section>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    read: 'bg-neutral-100 text-neutral-700',
    actioned: 'bg-emerald-100 text-emerald-800',
    archived: 'bg-amber-100 text-amber-800',
  };
  return <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold uppercase ${colors[status] || colors.read}`}>{status}</span>;
}

function Detail({ label, value }: { label: string; value?: string }) {
  return <div className="min-w-0"><dt className="text-xs font-semibold text-neutral-500">{label}</dt><dd className="mt-1 break-words text-sm text-neutral-800">{value || '—'}</dd></div>;
}

function EmptyState() {
  return <div className="p-10 text-center"><Inbox className="mx-auto h-8 w-8 text-neutral-300" /><p className="mt-3 text-sm font-bold text-neutral-800">No matching entries</p><p className="mt-1 text-xs text-neutral-500">Try clearing the search or filters.</p></div>;
}

function knownStatus(status: string): FormEntryStatus {
  return statuses.includes(status as FormEntryStatus) ? status as FormEntryStatus : 'new';
}

function entryTitle(entry: FormEntry) {
  const values = entry.formData || {};
  const organization = stringValue(values.organizationName);
  const name = [stringValue(values.firstName || values.adminFirstName || values.name), stringValue(values.lastName || values.adminLastName)].filter(Boolean).join(' ');
  return organization || name || stringValue(values.email || values.adminEmail) || humanize(entry.type);
}

function entrySummary(entry: FormEntry) {
  return Object.entries(entry.formData || {}).slice(0, 4).map(([key, value]) => `${humanize(key)}: ${formatValue(value)}`).join(' · ');
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function humanize(value: string) {
  return value.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value || 'Unknown date' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function sortEntries(entries: FormEntry[]) {
  return [...entries].sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime());
}
