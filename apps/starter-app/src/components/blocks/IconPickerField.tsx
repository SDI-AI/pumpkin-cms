'use client'

import { createElement, useEffect, useMemo, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

const inputClass = 'w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pumpkin-500'
const canonicalIcons = LucideIcons.icons as Record<string, LucideIcon>
const iconNames = Object.keys(canonicalIcons).sort((a, b) => a.localeCompare(b))
const maxVisibleIcons = 120

function readableName(name: string) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Za-z])(\d)/g, '$1 $2')
}

function iconForName(name: string) {
  return (LucideIcons as unknown as Record<string, LucideIcon>)[name]
}

export function IconPickerField({ label = 'Icon', onChange, value }: {
  label?: string
  onChange: (value: string) => void
  value?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const CurrentIcon = value ? iconForName(value) : undefined
  const normalizedQuery = query.trim().toLowerCase().replace(/[\s_-]+/g, '')
  const matches = useMemo(() => {
    if (!normalizedQuery) return iconNames.slice(0, maxVisibleIcons)

    return iconNames
      .filter((name) => name.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => {
        const aName = a.toLowerCase()
        const bName = b.toLowerCase()
        return Number(bName.startsWith(normalizedQuery)) - Number(aName.startsWith(normalizedQuery)) || a.localeCompare(b)
      })
      .slice(0, maxVisibleIcons)
  }, [normalizedQuery])

  useEffect(() => {
    if (!open) return
    searchRef.current?.focus()

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  const choose = (name: string) => {
    onChange(name)
    setOpen(false)
    setQuery('')
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-neutral-600">{label}</label>
      <div className="flex gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-neutral-300 bg-white px-3">
          {CurrentIcon ? createElement(CurrentIcon, { className: 'h-5 w-5 shrink-0 text-neutral-700', 'aria-hidden': true }) : <span className="h-5 w-5 shrink-0 rounded border border-dashed border-neutral-300" aria-hidden="true" />}
          <input
            type="text"
            value={value || ''}
            onChange={(event) => onChange(event.target.value)}
            className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm outline-none"
            placeholder="Choose an icon"
            aria-label={`${label} name`}
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-md border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
        >
          Browse
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="shrink-0 rounded-md px-2 text-sm font-semibold text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
            aria-label={`Clear ${label.toLowerCase()}`}
          >
            Clear
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-neutral-950/50 p-4" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <div className="flex max-h-[min(760px,90vh)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label="Choose an icon">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-neutral-950">Choose an icon</h2>
                <p className="text-sm text-neutral-500">Search and select a Lucide icon.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100">Close</button>
            </div>
            <div className="border-b border-neutral-200 p-4">
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className={inputClass}
                placeholder="Search icons, for example globe, code, mail..."
                aria-label="Search icons"
              />
              <p className="mt-2 text-xs text-neutral-500">
                Showing {matches.length}{matches.length === maxVisibleIcons ? '+' : ''} results{normalizedQuery ? ` for “${query.trim()}”` : ''}
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {matches.length ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {matches.map((name) => {
                    const PickerIcon = canonicalIcons[name]
                    const selected = name === value
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => choose(name)}
                        className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border p-2 text-center hover:border-pumpkin-400 hover:bg-pumpkin-50 ${selected ? 'border-pumpkin-500 bg-pumpkin-50 text-pumpkin-800' : 'border-neutral-200 text-neutral-700'}`}
                        title={name}
                        aria-pressed={selected}
                      >
                        <PickerIcon className="h-7 w-7" aria-hidden="true" />
                        <span className="line-clamp-2 break-words text-[11px] leading-tight">{readableName(name)}</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="py-16 text-center text-sm text-neutral-500">No icons match “{query.trim()}”.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
