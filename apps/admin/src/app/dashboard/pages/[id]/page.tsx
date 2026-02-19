'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'
import { Page } from 'pumpkin-ts-models'
import type { IHtmlBlock } from 'pumpkin-ts-models'
import { ContentBlocksEditor } from '@/components/blocks'

export default function PageEditorPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token, user } = useAuth()
  const pageId = params.id as string
  const isNew = pageId === 'new'
  // Use tenantId from query param (set by pages list), fall back to user's tenant
  const tenantId = searchParams.get('tenantId') || user?.tenantId || ''

  const [formData, setFormData] = useState<Page>({
    id: '',
    PageId: '',
    tenantId: tenantId || user?.tenantId || '',
    pageSlug: '',
    PageVersion: 1,
    Layout: 'standard',
    MetaData: {
      category: '',
      product: '',
      keyword: '',
      pageType: 'Keyword',
      title: '',
      description: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: user?.username || '',
      language: 'en',
      market: 'us',
    },
    searchData: {
      state: '',
      city: '',
      metro: '',
      county: '',
      keyword: '',
      tags: [],
      contentSummary: '',
      blockTypes: [],
    },
    ContentData: {
      ContentBlocks: [],
    },
    contentRelationships: {
      isHub: false,
      hubPageSlug: '',
      topicCluster: '',
      relatedHubs: [],
      spokePriority: 0,
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: [],
      robots: 'index, follow',
      canonicalUrl: '',
      alternateUrls: [],
      structuredData: '',
      openGraph: {
        'og:title': '',
        'og:description': '',
        'og:type': 'website',
        'og:url': '',
        'og:image': '',
        'og:image:alt': '',
        'og:site_name': '',
        'og:locale': 'en_US',
      },
      twitterCard: {
        'twitter:card': 'summary_large_image',
        'twitter:title': '',
        'twitter:description': '',
        'twitter:image': '',
        'twitter:site': '',
        'twitter:creator': '',
      },
    },
    isPublished: false,
    publishedAt: null,
    includeInSitemap: true,
  })

  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    metadata: true,
    contentBlocks: true,
    search: false,
    seo: false,
    relationships: false,
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load page data when editing existing page
  useEffect(() => {
    const fetchPage = async () => {
      if (isNew || !token || !user || !tenantId) return

      try {
        setLoading(true)
        setError(null)
        const pageSlug = decodeURIComponent(pageId)
        console.log('[PageEditor] Loading page:', { pageId, pageSlug, tenantId })
        const page = await apiClient.getPage(token, tenantId, pageSlug)
        console.log('[PageEditor] Page loaded:', { id: page.id, slug: page.pageSlug, title: page.MetaData?.title })
        setFormData(page)
      } catch (err: any) {
        console.error('[PageEditor] Failed to load page:', err)
        setError(err.message || 'Failed to load page')
      } finally {
        setLoading(false)
      }
    }

    fetchPage()
  }, [pageId, isNew, token, user, tenantId])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const updateField = (path: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev }
      const keys = path.split('.')
      let current: any = newData
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      
      // Update timestamps
      newData.MetaData.updatedAt = new Date().toISOString()
      
      return newData
    })
  }

  const handleBlocksChange = (blocks: IHtmlBlock[]) => {
    setFormData(prev => ({
      ...prev,
      ContentData: { ...prev.ContentData, ContentBlocks: blocks },
      // Auto-sync blockTypes in searchData
      searchData: {
        ...prev.searchData,
        blockTypes: Array.from(new Set(blocks.map(b => b.type))),
      },
      MetaData: { ...prev.MetaData, updatedAt: new Date().toISOString() },
    }))
  }

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault()
    if (!token || saving) return

    setSaving(true)
    setError(null)

    try {
      // Generate slug and IDs if new
      const pageToSave = { ...formData }
      if (isNew) {
        const slug = pageToSave.pageSlug || pageToSave.MetaData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        pageToSave.pageSlug = slug
        pageToSave.id = `${pageToSave.tenantId}-${slug}`
        pageToSave.PageId = pageToSave.id
      }

      // Update timestamp
      pageToSave.MetaData = {
        ...pageToSave.MetaData,
        updatedAt: new Date().toISOString(),
      }

      // Clean up array fields — trim whitespace and remove empty entries
      if (pageToSave.contentRelationships) {
        pageToSave.contentRelationships = {
          ...pageToSave.contentRelationships,
          relatedHubs: (pageToSave.contentRelationships.relatedHubs || []).map(s => s.trim()).filter(Boolean),
        }
      }

      let savedPage: Page
      if (isNew) {
        savedPage = await apiClient.createPage(token, pageToSave.tenantId, pageToSave)
      } else {
        savedPage = await apiClient.updatePage(token, pageToSave.tenantId, pageToSave.pageSlug, pageToSave)
      }

      setFormData(savedPage)

      // If was new, navigate to the edit URL so subsequent saves are updates
      if (isNew) {
        router.replace(`/dashboard/pages/${encodeURIComponent(savedPage.pageSlug)}?tenantId=${encodeURIComponent(savedPage.tenantId)}`)
      }
    } catch (err: any) {
      console.error('Save failed:', err)
      setError(err.message || 'Failed to save page')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/dashboard/pages')}
            className="text-neutral-600 hover:text-neutral-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">
              {isNew ? 'Create New Page' : 'Edit Page'}
            </h1>
            <p className="text-sm text-neutral-600">
              {formData.pageSlug ? `/${formData.pageSlug}` : 'Enter page details'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => updateField('isPublished', !formData.isPublished)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              formData.isPublished
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
            disabled={loading || saving}
          >
            {formData.isPublished ? 'Published' : 'Draft'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={loading || saving}
          >
            {saving ? 'Saving...' : 'Save Page'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-neutral-600">Loading page...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Failed to Load Page</h2>
            <p className="text-neutral-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/dashboard/pages')}
              className="btn-primary"
            >
              Back to Pages
            </button>
          </div>
        </div>
      )}

      {/* Two-column layout - only show when not loading and no error */}
      {!loading && !error && (
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Form */}
        <div className="flex-1 overflow-y-auto bg-neutral-50 p-6">
          <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
            
            {/* Basic Information */}
            <section className="bg-white rounded-lg shadow-sm">
              <button
                type="button"
                onClick={() => toggleSection('basic')}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
              >
                <h2 className="text-lg font-semibold text-neutral-900">Basic Information</h2>
                <svg
                  className={`w-5 h-5 transform transition-transform ${expandedSections.basic ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSections.basic && (
                <div className="px-6 pb-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Page Slug *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.pageSlug}
                      onChange={(e) => updateField('pageSlug', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="my-page-slug"
                    />
                    <p className="text-xs text-neutral-500 mt-1">URL-friendly identifier (lowercase, hyphens only)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Layout
                    </label>
                    <select
                      value={formData.Layout}
                      onChange={(e) => updateField('Layout', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="standard">Standard</option>
                      <option value="full-width">Full Width</option>
                      <option value="sidebar">With Sidebar</option>
                      <option value="landing">Landing Page</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.includeInSitemap}
                        onChange={(e) => updateField('includeInSitemap', e.target.checked)}
                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-700">Include in Sitemap</span>
                    </label>
                  </div>
                </div>
              )}
            </section>

            {/* Metadata */}
            <section className="bg-white rounded-lg shadow-sm">
              <button
                type="button"
                onClick={() => toggleSection('metadata')}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
              >
                <h2 className="text-lg font-semibold text-neutral-900">Page Metadata</h2>
                <svg
                  className={`w-5 h-5 transform transition-transform ${expandedSections.metadata ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSections.metadata && (
                <div className="px-6 pb-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.MetaData.title}
                      onChange={(e) => updateField('MetaData.title', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Page Title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.MetaData.description}
                      onChange={(e) => updateField('MetaData.description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Brief description of the page"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Page Type
                      </label>
                      <select
                        value={formData.MetaData.pageType}
                        onChange={(e) => updateField('MetaData.pageType', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="Keyword">Keyword</option>
                        <option value="Hub">Hub</option>
                        <option value="Spoke">Spoke</option>
                        <option value="Landing">Landing</option>
                        <option value="Static">Static</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={formData.MetaData.category}
                        onChange={(e) => updateField('MetaData.category', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Product
                      </label>
                      <input
                        type="text"
                        value={formData.MetaData.product}
                        onChange={(e) => updateField('MetaData.product', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Language
                      </label>
                      <input
                        type="text"
                        value={formData.MetaData.language}
                        onChange={(e) => updateField('MetaData.language', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Market
                      </label>
                      <input
                        type="text"
                        value={formData.MetaData.market}
                        onChange={(e) => updateField('MetaData.market', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Keyword
                    </label>
                    <input
                      type="text"
                      value={formData.MetaData.keyword}
                      onChange={(e) => updateField('MetaData.keyword', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Primary SEO keyword"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Content Blocks */}
            <section className="bg-white rounded-lg shadow-sm">
              <button
                type="button"
                onClick={() => toggleSection('contentBlocks')}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-neutral-900">Content Blocks</h2>
                  <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                    {formData.ContentData.ContentBlocks.length}
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 transform transition-transform ${expandedSections.contentBlocks ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSections.contentBlocks && (
                <div className="px-6 pb-6">
                  <ContentBlocksEditor
                    blocks={formData.ContentData.ContentBlocks}
                    onChange={handleBlocksChange}
                  />
                </div>
              )}
            </section>

            {/* Search Data */}
            <section className="bg-white rounded-lg shadow-sm">
              <button
                type="button"
                onClick={() => toggleSection('search')}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
              >
                <h2 className="text-lg font-semibold text-neutral-900">Search & SEO Data</h2>
                <svg
                  className={`w-5 h-5 transform transition-transform ${expandedSections.search ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSections.search && (
                <div className="px-6 pb-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={formData.searchData.state}
                        onChange={(e) => updateField('searchData.state', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.searchData.city}
                        onChange={(e) => updateField('searchData.city', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Metro
                      </label>
                      <input
                        type="text"
                        value={formData.searchData.metro}
                        onChange={(e) => updateField('searchData.metro', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        County
                      </label>
                      <input
                        type="text"
                        value={formData.searchData.county}
                        onChange={(e) => updateField('searchData.county', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.searchData.tags.join(', ')}
                      onChange={(e) => updateField('searchData.tags', e.target.value.split(',').map(t => t.trim()))}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Content Summary
                    </label>
                    <textarea
                      value={formData.searchData.contentSummary}
                      onChange={(e) => updateField('searchData.contentSummary', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Brief summary for search indexing"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* SEO Data */}
            <section className="bg-white rounded-lg shadow-sm">
              <button
                type="button"
                onClick={() => toggleSection('seo')}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
              >
                <h2 className="text-lg font-semibold text-neutral-900">SEO & Social Media</h2>
                <svg
                  className={`w-5 h-5 transform transition-transform ${expandedSections.seo ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSections.seo && (
                <div className="px-6 pb-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      value={formData.seo.metaTitle}
                      onChange={(e) => updateField('seo.metaTitle', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="SEO-optimized title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Meta Description
                    </label>
                    <textarea
                      value={formData.seo.metaDescription}
                      onChange={(e) => updateField('seo.metaDescription', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="SEO meta description (150-160 characters)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Keywords (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.seo.keywords.join(', ')}
                      onChange={(e) => updateField('seo.keywords', e.target.value.split(',').map(k => k.trim()))}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Robots
                      </label>
                      <input
                        type="text"
                        value={formData.seo.robots}
                        onChange={(e) => updateField('seo.robots', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Canonical URL
                      </label>
                      <input
                        type="url"
                        value={formData.seo.canonicalUrl}
                        onChange={(e) => updateField('seo.canonicalUrl', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-900 mb-2">Open Graph</h3>
                    <div className="space-y-3 pl-4 border-l-2 border-neutral-200">
                      <input
                        type="text"
                        value={formData.seo.openGraph['og:title']}
                        onChange={(e) => updateField('seo.openGraph.og:title', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="OG Title"
                      />
                      <input
                        type="text"
                        value={formData.seo.openGraph['og:description']}
                        onChange={(e) => updateField('seo.openGraph.og:description', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="OG Description"
                      />
                      <input
                        type="url"
                        value={formData.seo.openGraph['og:image']}
                        onChange={(e) => updateField('seo.openGraph.og:image', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="OG Image URL"
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-900 mb-2">Twitter Card</h3>
                    <div className="space-y-3 pl-4 border-l-2 border-neutral-200">
                      <input
                        type="text"
                        value={formData.seo.twitterCard['twitter:title']}
                        onChange={(e) => updateField('seo.twitterCard.twitter:title', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Twitter Title"
                      />
                      <input
                        type="text"
                        value={formData.seo.twitterCard['twitter:description']}
                        onChange={(e) => updateField('seo.twitterCard.twitter:description', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Twitter Description"
                      />
                      <input
                        type="url"
                        value={formData.seo.twitterCard['twitter:image']}
                        onChange={(e) => updateField('seo.twitterCard.twitter:image', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Twitter Image URL"
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Content Relationships */}
            <section className="bg-white rounded-lg shadow-sm">
              <button
                type="button"
                onClick={() => toggleSection('relationships')}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
              >
                <h2 className="text-lg font-semibold text-neutral-900">Content Relationships</h2>
                <svg
                  className={`w-5 h-5 transform transition-transform ${expandedSections.relationships ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSections.relationships && (
                <div className="px-6 pb-6 space-y-5">
                  {/* Hub Toggle */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                    <input
                      type="checkbox"
                      id="isHub"
                      checked={formData.contentRelationships.isHub}
                      onChange={(e) => updateField('contentRelationships.isHub', e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="isHub" className="text-sm font-medium text-neutral-900">
                      This is a Hub (pillar) page
                    </label>
                    <span className="ml-auto text-xs text-neutral-500">
                      {formData.contentRelationships.isHub ? 'Hub pages aggregate spoke content' : 'Spoke pages link to a parent hub'}
                    </span>
                  </div>

                  {/* Topic Cluster — shared by both hub and spoke */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Topic Cluster
                    </label>
                    <input
                      type="text"
                      value={formData.contentRelationships.topicCluster}
                      onChange={(e) => updateField('contentRelationships.topicCluster', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g. headless-cms, local-seo"
                    />
                    <p className="mt-1 text-xs text-neutral-500">Groups hub and spoke pages into a topic cluster</p>
                  </div>

                  {/* ── Hub-specific fields ── */}
                  {formData.contentRelationships.isHub && (
                    <div className="space-y-4 p-4 rounded-lg border border-blue-200 bg-blue-50/50">
                      <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        Hub Settings
                      </h3>

                      {/* Related Hubs */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Related Hub Slugs
                        </label>
                        <p className="text-xs text-neutral-500 mb-2">Other hub pages related to this one (for cross-linking).</p>
                        <textarea
                          value={(formData.contentRelationships.relatedHubs || []).join('\n')}
                          onChange={(e) => updateField('contentRelationships.relatedHubs', e.target.value.split('\n'))}
                          rows={3}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                          placeholder={"related-hub-slug-1\nrelated-hub-slug-2"}
                        />
                      </div>
                    </div>
                  )}

                  {/* ── Spoke-specific fields ── */}
                  {!formData.contentRelationships.isHub && (
                    <div className="space-y-4 p-4 rounded-lg border border-amber-200 bg-amber-50/50">
                      <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        Spoke Settings
                      </h3>

                      {/* Hub Page Slug */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Parent Hub Page Slug
                        </label>
                        <input
                          type="text"
                          value={formData.contentRelationships.hubPageSlug}
                          onChange={(e) => updateField('contentRelationships.hubPageSlug', e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                          placeholder="parent-hub-slug"
                        />
                        <p className="mt-1 text-xs text-neutral-500">The hub page this spoke belongs to</p>
                      </div>

                      {/* Spoke Priority */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Spoke Priority
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={formData.contentRelationships.spokePriority}
                          onChange={(e) => updateField('contentRelationships.spokePriority', parseInt(e.target.value) || 0)}
                          className="w-32 px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <p className="mt-1 text-xs text-neutral-500">Higher priority spokes appear first (0 = default)</p>
                      </div>

                      {/* Related Hubs (spokes can also reference other hubs) */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Related Hub Slugs
                        </label>
                        <p className="text-xs text-neutral-500 mb-2">Other hub pages related to this spoke&apos;s topic.</p>
                        <textarea
                          value={(formData.contentRelationships.relatedHubs || []).join('\n')}
                          onChange={(e) => updateField('contentRelationships.relatedHubs', e.target.value.split('\n'))}
                          rows={3}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                          placeholder={"related-hub-slug-1\nrelated-hub-slug-2"}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

          </form>
        </div>

        {/* Right Column - JSON Preview */}
        <div className="w-1/2 border-l border-neutral-200 bg-neutral-900 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-neutral-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-100">JSON Preview</h2>
            <button
              onClick={() => navigator.clipboard.writeText(JSON.stringify(formData, null, 2))}
              className="text-xs px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded"
            >
              Copy JSON
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <pre className="text-sm text-neutral-300 font-mono">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
