'use client'

import { useState, useEffect, useRef } from 'react'

interface AddSpokeModalProps {
  hubPageSlug: string
  onConfirm: (slug: string) => void
  onCancel: () => void
}

export default function AddSpokeModal({ hubPageSlug, onConfirm, onCancel }: AddSpokeModalProps) {
  const [slug, setSlug] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const normalize = (value: string) =>
    value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = normalize(slug)
    if (!normalized) {
      setError('Please enter a valid slug (letters, numbers, hyphens).')
      return
    }
    onConfirm(normalized)
  }

  const preview = slug.trim() ? normalize(slug) : ''

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-xl shadow-2xl border border-neutral-200 w-full max-w-md mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 bg-gradient-to-r from-orange-50 to-amber-50">
          <h2 className="text-sm font-bold text-neutral-900">Add Spoke Page</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Create a new spoke page linked to a hub</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Hub slug display */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Hub Page Slug</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
              <span className="inline-block w-2 h-2 rounded-full bg-orange-400 shrink-0" />
              <span className="text-sm font-medium text-orange-800 truncate">{hubPageSlug}</span>
            </div>
          </div>

          {/* Slug input */}
          <div>
            <label htmlFor="spoke-slug" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              New Page Slug
            </label>
            <input
              ref={inputRef}
              id="spoke-slug"
              type="text"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setError('') }}
              onKeyDown={(e) => { if (e.key === 'Escape') onCancel() }}
              placeholder="e.g. my-new-spoke-page"
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 placeholder:text-neutral-400"
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            {preview && !error && (
              <p className="text-xs text-neutral-400 mt-1">
                Will be saved as: <span className="font-mono text-neutral-600">{preview}</span>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-100 bg-neutral-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-xs font-medium text-neutral-600 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 text-xs font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Create Page
          </button>
        </div>
      </form>
    </div>
  )
}
