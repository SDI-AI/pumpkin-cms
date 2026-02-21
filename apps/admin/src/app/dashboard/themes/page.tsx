'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'
import { Theme } from 'pumpkin-ts-models'

export default function ThemesPage() {
  const router = useRouter()
  const { token, user, currentTenant } = useAuth()
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [themeToDelete, setThemeToDelete] = useState<Theme | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchThemes = async () => {
    if (!token || !user || !currentTenant) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('[Themes] Fetching themes for tenant:', currentTenant.tenantId)

      const themesData = await apiClient.getThemes(token, currentTenant.tenantId)
      console.log('[Themes] Fetched', themesData.length, 'themes')
      setThemes(themesData)
    } catch (err: any) {
      console.error('[Themes] Error fetching themes:', err)
      setError(err.message || 'Failed to load themes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchThemes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user, currentTenant])

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
      console.error('[Themes] Error deleting theme:', err)
      setError(err.message || 'Failed to delete theme')
    } finally {
      setDeleting(false)
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
    return <div className="text-center py-12">Please log in to view themes.</div>
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Themes</h1>
            <p className="text-neutral-600">
              Manage site-wide themes including header, footer, styling, and navigation
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/themes/new')}
            className="btn btn-primary flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Theme</span>
          </button>
        </div>

        {/* Error Message */}
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

        {/* Themes Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-neutral-600">Loading themes...</p>
            </div>
          ) : themes.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 text-neutral-400 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No themes found</h3>
              <p className="text-neutral-600">
                {currentTenant
                  ? `No themes found for "${currentTenant.name}". Create your first theme to get started.`
                  : 'Select a tenant to view themes.'}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Name
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
                {themes.map((theme) => (
                  <tr key={theme.themeId} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-neutral-900">{theme.name}</div>
                        {theme.description && (
                          <div className="text-xs text-neutral-500 mt-0.5 truncate max-w-xs">
                            {theme.description}
                          </div>
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
                        onClick={() => router.push(`/dashboard/themes/${theme.themeId}`)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(theme)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                className="px-4 py-2 border border-neutral-300 rounded-md text-neutral-700 hover:bg-neutral-50"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
