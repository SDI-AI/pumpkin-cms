'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'
import { Page, Tenant } from 'pumpkin-ts-models'

export default function PagesPage() {
  const router = useRouter()
  const { token, user } = useAuth()
  const [pages, setPages] = useState<Page[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isSuperAdmin = user?.role === 'SuperAdmin'

  // Fetch tenants (for SuperAdmin filter)
  useEffect(() => {
    const fetchTenants = async () => {
      if (!token || !isSuperAdmin) return
      
      try {
        const allTenants = await apiClient.getTenants(token)
        setTenants(allTenants)
      } catch (error) {
        console.error('Error fetching tenants:', error)
      }
    }

    fetchTenants()
  }, [token, isSuperAdmin])

  // Fetch pages
  useEffect(() => {
    const fetchPages = async () => {
      if (!token || !user) return

      try {
        setLoading(true)
        setError(null)
        
        // Use selected tenant or default to user's tenant
        const targetTenantId = selectedTenantId || user.tenantId
        const pagesData = await apiClient.getPages(token, targetTenantId)
        setPages(pagesData)
      } catch (error) {
        console.error('Error fetching pages:', error)
        setError(error instanceof Error ? error.message : 'Failed to load pages')
      } finally {
        setLoading(false)
      }
    }

    fetchPages()
  }, [token, user, selectedTenantId])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!user || !token) {
    return <div className="text-center py-12">Please log in to view pages.</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Pages</h1>
          <p className="text-neutral-600">Manage your content pages</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/pages/new')}
          className="btn btn-primary flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Page</span>
        </button>
      </div>

      {/* Filters */}
      {isSuperAdmin && tenants.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-neutral-700">
              Filter by Tenant:
            </label>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">My Tenant ({user.tenantId})</option>
              {tenants
                .filter(t => t.tenantId !== user.tenantId)
                .map(tenant => (
                  <option key={tenant.tenantId} value={tenant.tenantId}>
                    {tenant.name} ({tenant.tenantId})
                  </option>
                ))
              }
            </select>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Pages Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-neutral-600">Loading pages...</p>
          </div>
        ) : pages.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 text-neutral-400 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No pages found</h3>
            <p className="text-neutral-600">
              {selectedTenantId 
                ? 'This tenant has no pages yet.'
                : 'Your tenant has no pages yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Page Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {pages.map((page) => (
                  <tr
                    key={page.id}
                    onClick={() => router.push(`/dashboard/pages/${encodeURIComponent(page.pageSlug)}`)}
                    className="hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">
                        {page.MetaData.title || 'Untitled'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">
                        /{page.pageSlug}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">
                        {page.tenantId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {page.isPublished ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">
                        {page.MetaData.pageType}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {formatDate(page.MetaData.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {pages.length > 0 && (
        <div className="flex items-center justify-between text-sm text-neutral-600">
          <div>
            Showing {pages.length} page{pages.length !== 1 ? 's' : ''}
          </div>
          <div>
            {pages.filter(p => p.isPublished).length} published, {' '}
            {pages.filter(p => !p.isPublished).length} draft
          </div>
        </div>
      )}
    </div>
  )
}
