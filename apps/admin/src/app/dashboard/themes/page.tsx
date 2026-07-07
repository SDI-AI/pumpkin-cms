'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Edit3,
  Filter,
  Loader2,
  Palette,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminAlert, EmptyState, LoadingState } from '@/components/admin/AdminStates'
import { apiClient } from '@/lib/api'
import { Theme } from 'pumpkin-ts-models'

type ThemeFilter = 'all' | 'active' | 'inactive' | 'system' | 'custom'

const themeFilters: { value: ThemeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'system', label: 'System' },
  { value: 'custom', label: 'Custom' },
]

export default function ThemesPage() {
  const router = useRouter()
  const { token, user, currentTenant } = useAuth()
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [themeToDelete, setThemeToDelete] = useState<Theme | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [activatingThemeId, setActivatingThemeId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ThemeFilter>('all')

  const fetchThemes = async () => {
    if (!token || !user || !currentTenant) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const themesData = await apiClient.getThemes(token, currentTenant.tenantId)
      setThemes(themesData)
    } catch (err: any) {
      setError(err.message || 'Failed to load themes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchThemes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user, currentTenant])

  const filteredThemes = useMemo(() => {
    const query = search.trim().toLowerCase()

    return themes.filter((theme) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && theme.isActive) ||
        (filter === 'inactive' && !theme.isActive) ||
        (filter === 'system' && theme.isSystem) ||
        (filter === 'custom' && theme.isCustom)

      if (!matchesFilter) return false
      if (!query) return true

      return [
        theme.name,
        theme.label,
        theme.themeId,
        theme.description,
        theme.category,
        ...(theme.tags || []),
      ]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(query))
    })
  }, [themes, search, filter])

  const activeTheme = themes.find(theme => theme.isActive)

  const handleDeleteClick = (theme: Theme) => {
    setThemeToDelete(theme)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!themeToDelete || !token || !currentTenant) return

    try {
      setDeleting(true)
      await apiClient.deleteTheme(token, currentTenant.tenantId, themeToDelete.themeId)
      setShowDeleteConfirm(false)
      setThemeToDelete(null)
      fetchThemes()
    } catch (err: any) {
      setError(err.message || 'Failed to delete theme')
    } finally {
      setDeleting(false)
    }
  }

  const handleActivateTheme = async (theme: Theme) => {
    if (!token || !currentTenant || theme.isActive) return

    try {
      setActivatingThemeId(theme.themeId)
      setError(null)
      const activated = await apiClient.activateTheme(token, currentTenant.tenantId, theme.themeId)
      setThemes(current =>
        current.map(item => ({
          ...item,
          isActive: item.themeId === activated.themeId,
          updatedAt: item.themeId === activated.themeId ? activated.updatedAt : item.updatedAt,
        }))
      )
    } catch (err: any) {
      setError(err.message || 'Failed to activate theme')
    } finally {
      setActivatingThemeId(null)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (!user || !token) {
    return <EmptyState title="Sign in required" description="Please log in to view themes." />
  }

  return (
    <>
      <div className="space-y-6">
        <AdminPageHeader
          title="Themes"
          description="Manage tenant themes, preview palettes, and choose the active theme used by public content."
          eyebrow={currentTenant?.name}
          actions={
            <button
              onClick={() => router.push('/dashboard/themes/new')}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>New Theme</span>
            </button>
          }
        />

        {error && (
          <AdminAlert tone="danger" onDismiss={() => setError(null)}>
            {error}
          </AdminAlert>
        )}

        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="input h-10 pl-9"
                placeholder="Search themes"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600">
                <Filter className="h-4 w-4" aria-hidden="true" />
                <span>{filteredThemes.length} of {themes.length}</span>
              </div>
              <div className="flex rounded-lg border border-neutral-200 bg-neutral-50 p-1">
                {themeFilters.map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFilter(item.value)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      filter === item.value
                        ? 'bg-white text-primary-700 shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-950'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activeTheme && (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span className="font-medium">{activeTheme.label || activeTheme.name}</span>
              <span className="text-green-700">is active for {currentTenant?.name || 'this tenant'}.</span>
            </div>
          )}
        </div>

        {/* Themes Table */}
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          {loading ? (
            <LoadingState label="Loading themes" />
          ) : themes.length === 0 ? (
            <EmptyState
              icon={<Palette className="h-6 w-6" aria-hidden="true" />}
              title="No themes found"
              description={currentTenant ? `Create the first theme for ${currentTenant.name}.` : 'Select a tenant to view themes.'}
            />
          ) : filteredThemes.length === 0 ? (
            <EmptyState
              icon={<Search className="h-6 w-6" aria-hidden="true" />}
              title="No themes match"
              description="Try a different search term or filter."
            />
          ) : (
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Preview
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Theme ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Menu Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {filteredThemes.map((theme) => (
                  <tr key={theme.themeId} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-neutral-900">{theme.label || theme.name}</div>
                        {theme.description && (
                          <div className="text-xs text-neutral-500 mt-0.5 truncate max-w-xs">
                            {theme.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getThemePalette(theme).map((color, index) => (
                          <span
                            key={`${theme.themeId}-${color}-${index}`}
                            className="h-6 w-6 rounded-full border border-black/10"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                        {getThemePalette(theme).length === 0 && (
                          <span className="text-sm text-neutral-500">No palette</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                        {theme.themeId}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          theme.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {theme.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-neutral-600">
                        {theme.menu?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-neutral-600">
                        {formatDate(theme.updatedAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => handleActivateTheme(theme)}
                        disabled={theme.isActive || activatingThemeId === theme.themeId}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-50 disabled:cursor-default disabled:bg-green-50 disabled:text-green-700"
                      >
                        {activatingThemeId === theme.themeId ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        )}
                        <span>{theme.isActive ? 'Active' : 'Activate'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push(`/dashboard/themes/${theme.themeId}`)}
                        className="ml-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
                      >
                        <Edit3 className="h-4 w-4" aria-hidden="true" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(theme)}
                        className="ml-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && themeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Delete Theme</h3>
            <p className="text-neutral-600 mb-2">
              Are you sure you want to delete <strong>{themeToDelete.name}</strong>?
            </p>
            {themeToDelete.isActive && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Warning:</strong> This is the active theme. Deleting it will leave the tenant without an active theme.
                </p>
              </div>
            )}
            <p className="text-sm text-neutral-500 mb-6">This action cannot be undone.</p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setThemeToDelete(null)
                }}
                className="btn btn-secondary"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                disabled={deleting}
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>{deleting ? 'Deleting' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function getThemePalette(theme: Theme): string[] {
  const previewPalette = theme.preview?.palette?.filter(Boolean) || []
  const fallbackPalette = [
    theme.preview?.background,
    theme.preview?.foreground,
    theme.preview?.primary,
    theme.preview?.accent,
    theme.cssVariables?.['--background'],
    theme.cssVariables?.['--foreground'],
    theme.cssVariables?.['--primary'],
    theme.cssVariables?.['--accent'],
  ].filter(Boolean) as string[]

  return [...previewPalette, ...fallbackPalette].slice(0, 5)
}
