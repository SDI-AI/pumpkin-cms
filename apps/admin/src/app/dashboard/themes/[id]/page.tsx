'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'
import { Theme, ThemeHeader, ThemeFooter, MenuItem } from 'pumpkin-ts-models'

type TabId = 'general' | 'header' | 'footer' | 'styles' | 'menu'

const TABS: { id: TabId; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'header', label: 'Header' },
  { id: 'footer', label: 'Footer' },
  { id: 'styles', label: 'Block Styles' },
  { id: 'menu', label: 'Menu' },
]

function createEmptyTheme(tenantId: string): Theme {
  return {
    id: '',
    themeId: '',
    tenantId,
    name: '',
    description: '',
    isActive: false,
    header: {
      logoUrl: '',
      logoAlt: '',
      sticky: true,
      ctaText: '',
      ctaUrl: '',
      ctaTarget: '_self',
      classNames: {},
    },
    footer: {
      copyright: '',
      description: '',
      classNames: {},
    },
    blockStyles: {},
    menu: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function createEmptyMenuItem(): MenuItem {
  return {
    label: '',
    url: '',
    target: '_self',
    icon: '',
    order: 0,
    isVisible: true,
    children: [],
  }
}

export default function ThemeEditorPage() {
  const router = useRouter()
  const params = useParams()
  const themeId = params.id as string
  const isNew = themeId === 'new'

  const { token, user, currentTenant } = useAuth()
  const [theme, setTheme] = useState<Theme | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('general')
  const [blockStylesJson, setBlockStylesJson] = useState('')
  const [blockStylesError, setBlockStylesError] = useState<string | null>(null)
  const [headerClassNamesJson, setHeaderClassNamesJson] = useState('')
  const [headerClassNamesError, setHeaderClassNamesError] = useState<string | null>(null)
  const [footerClassNamesJson, setFooterClassNamesJson] = useState('')
  const [footerClassNamesError, setFooterClassNamesError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTheme = async () => {
      if (!token || !user || !currentTenant) {
        setLoading(false)
        return
      }

      if (isNew) {
        const empty = createEmptyTheme(currentTenant.tenantId)
        setTheme(empty)
        setBlockStylesJson(JSON.stringify(empty.blockStyles, null, 2))
        setHeaderClassNamesJson(JSON.stringify(empty.header.classNames, null, 2))
        setFooterClassNamesJson(JSON.stringify(empty.footer.classNames, null, 2))
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await apiClient.getTheme(token, currentTenant.tenantId, themeId)
        setTheme(data)
        setBlockStylesJson(JSON.stringify(data.blockStyles || {}, null, 2))
        setHeaderClassNamesJson(JSON.stringify(data.header?.classNames || {}, null, 2))
        setFooterClassNamesJson(JSON.stringify(data.footer?.classNames || {}, null, 2))
      } catch (err: any) {
        console.error('[ThemeEditor] Error fetching theme:', err)
        setError(err.message || 'Failed to load theme')
      } finally {
        setLoading(false)
      }
    }

    fetchTheme()
  }, [token, user, currentTenant, themeId, isNew])

  const updateTheme = useCallback((updates: Partial<Theme>) => {
    setTheme(prev => prev ? { ...prev, ...updates } : prev)
  }, [])

  const updateHeader = useCallback((updates: Partial<ThemeHeader>) => {
    setTheme(prev => prev ? { ...prev, header: { ...prev.header, ...updates } } : prev)
  }, [])

  const updateFooter = useCallback((updates: Partial<ThemeFooter>) => {
    setTheme(prev => prev ? { ...prev, footer: { ...prev.footer, ...updates } } : prev)
  }, [])

  const handleSave = async () => {
    if (!theme || !token || !currentTenant) return

    // Validate required fields
    if (!theme.name.trim()) {
      setError('Theme name is required')
      setActiveTab('general')
      return
    }
    if (isNew && !theme.themeId.trim()) {
      setError('Theme ID is required')
      setActiveTab('general')
      return
    }

    // Parse blockStyles JSON
    let parsedBlockStyles = theme.blockStyles
    try {
      parsedBlockStyles = JSON.parse(blockStylesJson)
      setBlockStylesError(null)
    } catch {
      setBlockStylesError('Invalid JSON in block styles')
      setActiveTab('styles')
      return
    }

    // Parse header classNames JSON
    let parsedHeaderClassNames = theme.header.classNames
    try {
      parsedHeaderClassNames = JSON.parse(headerClassNamesJson)
      setHeaderClassNamesError(null)
    } catch {
      setHeaderClassNamesError('Invalid JSON in header class names')
      setActiveTab('header')
      return
    }

    // Parse footer classNames JSON
    let parsedFooterClassNames = theme.footer.classNames
    try {
      parsedFooterClassNames = JSON.parse(footerClassNamesJson)
      setFooterClassNamesError(null)
    } catch {
      setFooterClassNamesError('Invalid JSON in footer class names')
      setActiveTab('footer')
      return
    }

    const themeToSave: Theme = {
      ...theme,
      blockStyles: parsedBlockStyles,
      header: { ...theme.header, classNames: parsedHeaderClassNames },
      footer: { ...theme.footer, classNames: parsedFooterClassNames },
      tenantId: currentTenant.tenantId,
      updatedAt: new Date().toISOString(),
    }

    if (isNew) {
      themeToSave.id = themeToSave.themeId
      themeToSave.createdAt = new Date().toISOString()
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      if (isNew) {
        const created = await apiClient.createTheme(token, currentTenant.tenantId, themeToSave)
        setSuccess('Theme created successfully!')
        // Navigate to the editor for the new theme
        setTimeout(() => router.push(`/dashboard/themes/${created.themeId}`), 1000)
      } else {
        const updated = await apiClient.updateTheme(token, currentTenant.tenantId, themeId, themeToSave)
        setTheme(updated)
        setBlockStylesJson(JSON.stringify(updated.blockStyles || {}, null, 2))
        setHeaderClassNamesJson(JSON.stringify(updated.header?.classNames || {}, null, 2))
        setFooterClassNamesJson(JSON.stringify(updated.footer?.classNames || {}, null, 2))
        setSuccess('Theme saved successfully!')
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err: any) {
      console.error('[ThemeEditor] Error saving theme:', err)
      setError(err.message || 'Failed to save theme')
    } finally {
      setSaving(false)
    }
  }

  if (!user || !token) {
    return <div className="text-center py-12">Please log in to edit themes.</div>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-neutral-600">Loading theme...</p>
        </div>
      </div>
    )
  }

  if (!theme) {
    return (
      <div className="card bg-red-50 border-red-200 p-6">
        <p className="text-red-800">{error || 'Theme not found'}</p>
        <button onClick={() => router.push('/dashboard/themes')} className="mt-4 btn btn-secondary">
          Back to Themes
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/dashboard/themes')}
            className="text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">
              {isNew ? 'New Theme' : `Edit: ${theme.name}`}
            </h1>
            {!isNew && (
              <p className="text-neutral-500 text-sm mt-1">
                ID: {theme.themeId} &middot; Last updated: {new Date(theme.updatedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary flex items-center space-x-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{isNew ? 'Create Theme' : 'Save Changes'}</span>
            </>
          )}
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="flex space-x-1" aria-label="Tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-white border border-b-white border-neutral-200 -mb-px text-primary-700'
                  : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="card p-6">
        {activeTab === 'general' && (
          <GeneralTab theme={theme} isNew={isNew} updateTheme={updateTheme} />
        )}
        {activeTab === 'header' && (
          <HeaderTab
            header={theme.header}
            updateHeader={updateHeader}
            classNamesJson={headerClassNamesJson}
            setClassNamesJson={setHeaderClassNamesJson}
            classNamesError={headerClassNamesError}
          />
        )}
        {activeTab === 'footer' && (
          <FooterTab
            footer={theme.footer}
            updateFooter={updateFooter}
            classNamesJson={footerClassNamesJson}
            setClassNamesJson={setFooterClassNamesJson}
            classNamesError={footerClassNamesError}
          />
        )}
        {activeTab === 'styles' && (
          <BlockStylesTab
            json={blockStylesJson}
            setJson={setBlockStylesJson}
            error={blockStylesError}
          />
        )}
        {activeTab === 'menu' && (
          <MenuTab menu={theme.menu} updateTheme={updateTheme} />
        )}
      </div>
    </div>
  )
}

// ─── General Tab ──────────────────────────────────────────────

function GeneralTab({
  theme,
  isNew,
  updateTheme,
}: {
  theme: Theme
  isNew: boolean
  updateTheme: (updates: Partial<Theme>) => void
}) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Theme Name *</label>
        <input
          type="text"
          required
          value={theme.name}
          onChange={e => updateTheme({ name: e.target.value })}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="My Site Theme"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Theme ID {isNew ? '*' : ''}
        </label>
        {isNew ? (
          <>
            <input
              type="text"
              required
              value={theme.themeId}
              onChange={e => updateTheme({ themeId: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="my-site-theme"
              pattern="[a-z0-9\-]+"
              title="Only lowercase letters, numbers, and hyphens allowed"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Unique identifier (lowercase letters, numbers, and hyphens only)
            </p>
          </>
        ) : (
          <input
            type="text"
            disabled
            value={theme.themeId}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50 text-neutral-500"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
        <textarea
          value={theme.description}
          onChange={e => updateTheme({ description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="A brief description of this theme..."
        />
      </div>

      <div>
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={theme.isActive}
            onChange={e => updateTheme({ isActive: e.target.checked })}
            className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 h-5 w-5"
          />
          <div>
            <span className="text-sm font-medium text-neutral-700">Active Theme</span>
            <p className="text-xs text-neutral-500">
              Only one theme can be active per tenant. Setting this active will be used for content serving.
            </p>
          </div>
        </label>
      </div>

      {!isNew && (
        <div className="pt-4 border-t border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-700 mb-3">Theme Info</h3>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-neutral-500">Created</dt>
              <dd className="text-neutral-900">{new Date(theme.createdAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Last Updated</dt>
              <dd className="text-neutral-900">{new Date(theme.updatedAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Tenant ID</dt>
              <dd className="text-neutral-900 font-mono">{theme.tenantId}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Footer Description</dt>
              <dd className="text-neutral-900">{theme.footer?.description ? 'Set' : 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Header CTA</dt>
              <dd className="text-neutral-900">{theme.header?.ctaText || 'None'}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Block Style Types</dt>
              <dd className="text-neutral-900">{Object.keys(theme.blockStyles || {}).length}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}

// ─── Header Tab ───────────────────────────────────────────────

function HeaderTab({
  header,
  updateHeader,
  classNamesJson,
  setClassNamesJson,
  classNamesError,
}: {
  header: ThemeHeader
  updateHeader: (updates: Partial<ThemeHeader>) => void
  classNamesJson: string
  setClassNamesJson: (val: string) => void
  classNamesError: string | null
}) {
  return (
    <div className="space-y-6">
      <div className="max-w-2xl space-y-4">
        <h3 className="text-lg font-semibold text-neutral-900">Header Settings</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Logo URL</label>
            <input
              type="text"
              value={header.logoUrl}
              onChange={e => updateHeader({ logoUrl: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://example.com/logo.svg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Logo Alt Text</label>
            <input
              type="text"
              value={header.logoAlt}
              onChange={e => updateHeader({ logoAlt: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Company Logo"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={header.sticky}
              onChange={e => updateHeader({ sticky: e.target.checked })}
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 h-5 w-5"
            />
            <div>
              <span className="text-sm font-medium text-neutral-700">Sticky Header</span>
              <p className="text-xs text-neutral-500">Header stays fixed at the top when scrolling</p>
            </div>
          </label>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-neutral-700">
            Header ClassNames (JSON)
          </label>
          {classNamesError && (
            <span className="text-xs text-red-600">{classNamesError}</span>
          )}
        </div>
        <p className="text-xs text-neutral-500 mb-2">
          Style-slot class overrides for the header wrapper. Keys are slot names, values are CSS class strings.
        </p>
        <textarea
          value={classNamesJson}
          onChange={e => setClassNamesJson(e.target.value)}
          rows={8}
          className={`w-full px-3 py-2 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            classNamesError ? 'border-red-300 bg-red-50' : 'border-neutral-300'
          }`}
          placeholder='{\n  "root": "bg-white shadow",\n  "logo": "h-8 w-auto"\n}'
        />
      </div>

    </div>
  )
}

// ─── Footer Tab ───────────────────────────────────────────────

function FooterTab({
  footer,
  updateFooter,
  classNamesJson,
  setClassNamesJson,
  classNamesError,
}: {
  footer: ThemeFooter
  updateFooter: (updates: Partial<ThemeFooter>) => void
  classNamesJson: string
  setClassNamesJson: (val: string) => void
  classNamesError: string | null
}) {
  return (
    <div className="space-y-6">
      <div className="max-w-2xl space-y-4">
        <h3 className="text-lg font-semibold text-neutral-900">Footer Settings</h3>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Copyright Text</label>
          <input
            type="text"
            value={footer.copyright}
            onChange={e => updateFooter({ copyright: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="© 2025 Company Name. All rights reserved."
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-neutral-700">
            Footer ClassNames (JSON)
          </label>
          {classNamesError && (
            <span className="text-xs text-red-600">{classNamesError}</span>
          )}
        </div>
        <p className="text-xs text-neutral-500 mb-2">
          Style-slot class overrides for the footer wrapper. Keys are slot names, values are CSS class strings.
        </p>
        <textarea
          value={classNamesJson}
          onChange={e => setClassNamesJson(e.target.value)}
          rows={8}
          className={`w-full px-3 py-2 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            classNamesError ? 'border-red-300 bg-red-50' : 'border-neutral-300'
          }`}
          placeholder='{\n  "root": "bg-neutral-900 text-white",\n  "copyright": "text-sm"\n}'
        />
      </div>

      <div className="max-w-2xl">
        <label className="block text-sm font-medium text-neutral-700 mb-1">Brand Description</label>
        <textarea
          value={footer.description || ''}
          onChange={e => updateFooter({ description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="A short brand tagline shown in the footer."
        />
      </div>
    </div>
  )
}

// ─── Block Styles Tab ─────────────────────────────────────────

function BlockStylesTab({
  json,
  setJson,
  error,
}: {
  json: string
  setJson: (val: string) => void
  error: string | null
}) {
  const formatJson = () => {
    try {
      const parsed = JSON.parse(json)
      setJson(JSON.stringify(parsed, null, 2))
    } catch {
      // Can't format invalid JSON — ignore
    }
  }

  const compactJson = () => {
    try {
      const parsed = JSON.parse(json)
      setJson(JSON.stringify(parsed))
    } catch {
      // Can't compact invalid JSON — ignore
    }
  }

  // Count block types and total slots
  let blockTypeCount = 0
  let slotCount = 0
  try {
    const parsed = JSON.parse(json)
    blockTypeCount = Object.keys(parsed).length
    slotCount = Object.values(parsed).reduce(
      (sum: number, slots: any) => sum + Object.keys(slots || {}).length,
      0
    )
  } catch {
    // Invalid JSON — skip stats
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">Block Styles (BlockStyleMap)</h3>
          <p className="text-sm text-neutral-500 mt-1">
            Per-block-type CSS class overrides. Outer key = block type (e.g., &quot;Hero&quot;, &quot;CardGrid&quot;),
            inner key = style slot (e.g., &quot;root&quot;, &quot;headline&quot;), value = CSS class string.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-neutral-500">
            {blockTypeCount} block type{blockTypeCount !== 1 ? 's' : ''} &middot; {slotCount} slot{slotCount !== 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={formatJson}
            className="px-3 py-1.5 border border-neutral-300 rounded-md text-neutral-700 hover:bg-neutral-50"
          >
            Format
          </button>
          <button
            type="button"
            onClick={compactJson}
            className="px-3 py-1.5 border border-neutral-300 rounded-md text-neutral-700 hover:bg-neutral-50"
          >
            Compact
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      <textarea
        value={json}
        onChange={e => setJson(e.target.value)}
        rows={30}
        className={`w-full px-3 py-2 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
          error ? 'border-red-300 bg-red-50' : 'border-neutral-300'
        }`}
        spellCheck={false}
      />

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> This JSON mirrors the <code className="bg-blue-100 px-1 rounded">BlockClassNamesMap</code> from
          pumpkin-block-views. Each block type (Hero, CardGrid, FAQ, etc.) can have style slots like
          &quot;root&quot;, &quot;headline&quot;, &quot;container&quot;, &quot;cta&quot;, etc. Values are Tailwind CSS class strings.
        </p>
      </div>
    </div>
  )
}

// ─── Menu Tab ─────────────────────────────────────────────────

function MenuTab({
  menu,
  updateTheme,
}: {
  menu: MenuItem[]
  updateTheme: (updates: Partial<Theme>) => void
}) {
  const setMenu = (newMenu: MenuItem[]) => {
    updateTheme({ menu: newMenu })
  }

  const addItem = () => {
    setMenu([...menu, { ...createEmptyMenuItem(), order: menu.length }])
  }

  const updateItem = (index: number, updates: Partial<MenuItem>) => {
    const updated = [...menu]
    updated[index] = { ...updated[index], ...updates }
    setMenu(updated)
  }

  const removeItem = (index: number) => {
    setMenu(menu.filter((_, i) => i !== index))
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === menu.length - 1)
    )
      return
    const updated = [...menu]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]]
    // Update order
    updated.forEach((item, i) => {
      item.order = i
    })
    setMenu(updated)
  }

  const addChildItem = (parentIndex: number) => {
    const updated = [...menu]
    const parent = updated[parentIndex]
    parent.children = [
      ...(parent.children || []),
      { ...createEmptyMenuItem(), order: parent.children?.length || 0 },
    ]
    setMenu(updated)
  }

  const updateChildItem = (parentIndex: number, childIndex: number, updates: Partial<MenuItem>) => {
    const updated = [...menu]
    const parent = updated[parentIndex]
    parent.children = [...(parent.children || [])]
    parent.children[childIndex] = { ...parent.children[childIndex], ...updates }
    setMenu(updated)
  }

  const removeChildItem = (parentIndex: number, childIndex: number) => {
    const updated = [...menu]
    const parent = updated[parentIndex]
    parent.children = (parent.children || []).filter((_, i) => i !== childIndex)
    setMenu(updated)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">Navigation Menu</h3>
          <p className="text-sm text-neutral-500 mt-1">
            Define the site navigation menu tree. Supports one level of nesting.
          </p>
        </div>
        <button
          type="button"
          onClick={addItem}
          className="btn btn-primary flex items-center space-x-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Menu Item</span>
        </button>
      </div>

      {menu.length === 0 ? (
        <div className="text-center py-8 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
          <svg className="w-10 h-10 mx-auto text-neutral-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <p className="text-neutral-500 mb-2">No menu items yet</p>
          <button
            type="button"
            onClick={addItem}
            className="text-primary-600 hover:text-primary-800 text-sm font-medium"
          >
            Add your first menu item
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {menu.map((item, index) => (
            <div key={index} className="border border-neutral-200 rounded-lg">
              {/* Parent Menu Item */}
              <div className="p-4 bg-neutral-50 rounded-t-lg">
                <div className="flex items-start gap-4">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      className="text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                      title="Move up"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === menu.length - 1}
                      className="text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                      title="Move down"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Fields */}
                  <div className="flex-1 grid grid-cols-12 gap-3">
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Label</label>
                      <input
                        type="text"
                        value={item.label}
                        onChange={e => updateItem(index, { label: e.target.value })}
                        className="w-full px-2 py-1.5 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Home"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-neutral-500 mb-1">URL</label>
                      <input
                        type="text"
                        value={item.url}
                        onChange={e => updateItem(index, { url: e.target.value })}
                        className="w-full px-2 py-1.5 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="/"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Target</label>
                      <select
                        value={item.target}
                        onChange={e => updateItem(index, { target: e.target.value })}
                        className="w-full px-2 py-1.5 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="_self">Same Tab</option>
                        <option value="_blank">New Tab</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-neutral-500 mb-1">Icon</label>
                      <input
                        type="text"
                        value={item.icon}
                        onChange={e => updateItem(index, { icon: e.target.value })}
                        className="w-full px-2 py-1.5 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="icon-name"
                      />
                    </div>
                    <div className="col-span-2 flex items-end gap-2">
                      <label className="flex items-center space-x-1.5 cursor-pointer pb-1.5">
                        <input
                          type="checkbox"
                          checked={item.isVisible}
                          onChange={e => updateItem(index, { isVisible: e.target.checked })}
                          className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-xs text-neutral-600">Visible</span>
                      </label>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-start gap-1 pt-5">
                    <button
                      type="button"
                      onClick={() => addChildItem(index)}
                      className="text-blue-500 hover:text-blue-700 p-1"
                      title="Add child item"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-400 hover:text-red-600 p-1"
                      title="Remove item"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Child Menu Items */}
              {item.children && item.children.length > 0 && (
                <div className="border-t border-neutral-200 p-4 pl-12 space-y-3">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Sub-items ({item.children.length})
                  </p>
                  {item.children.map((child, childIndex) => (
                    <div key={childIndex} className="flex items-start gap-3">
                      <div className="text-neutral-300 pt-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div className="flex-1 grid grid-cols-12 gap-3">
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={child.label}
                            onChange={e => updateChildItem(index, childIndex, { label: e.target.value })}
                            className="w-full px-2 py-1.5 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Sub-page"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={child.url}
                            onChange={e => updateChildItem(index, childIndex, { url: e.target.value })}
                            className="w-full px-2 py-1.5 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="/sub-page"
                          />
                        </div>
                        <div className="col-span-2">
                          <select
                            value={child.target}
                            onChange={e => updateChildItem(index, childIndex, { target: e.target.value })}
                            className="w-full px-2 py-1.5 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="_self">Same Tab</option>
                            <option value="_blank">New Tab</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={child.icon}
                            onChange={e => updateChildItem(index, childIndex, { icon: e.target.value })}
                            className="w-full px-2 py-1.5 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="icon"
                          />
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                          <label className="flex items-center space-x-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={child.isVisible}
                              onChange={e => updateChildItem(index, childIndex, { isVisible: e.target.checked })}
                              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-xs text-neutral-600">Visible</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => removeChildItem(index, childIndex)}
                            className="text-red-400 hover:text-red-600 p-1 ml-auto"
                            title="Remove sub-item"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
