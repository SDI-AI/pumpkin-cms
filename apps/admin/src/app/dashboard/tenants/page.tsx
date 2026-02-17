'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'
import { Tenant } from 'pumpkin-ts-models'

export default function TenantsPage() {
  const { token, user } = useAuth()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null)
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)

  // Check if user is SuperAdmin
  const isSuperAdmin = user?.role === 'SuperAdmin'

  useEffect(() => {
    if (token) {
      fetchTenants()
    }
  }, [token])

  const fetchTenants = async () => {
    try {
      setLoading(true)
      setError(null)
      const tenants = await apiClient.getTenants(token!)
      setTenants(tenants)
    } catch (err: any) {
      console.error('[Tenants] Error fetching tenants:', err)
      setError(err.message || 'Failed to load tenants')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setModalMode('create')
    setSelectedTenant(null)
    setShowModal(true)
  }

  const handleEdit = (tenant: Tenant) => {
    setModalMode('edit')
    setSelectedTenant(tenant)
    setShowModal(true)
  }

  const handleDeleteClick = (tenant: Tenant) => {
    setTenantToDelete(tenant)
    setShowDeleteConfirm(true)
  }
  const handleRegenerateApiKey = async (tenantId: string) => {
    try {
      const response = await apiClient.regenerateTenantApiKey(token!, tenantId)
      
      // Show the new API key in the modal
      setGeneratedApiKey(response.apiKey)
      setShowApiKeyModal(true)
      
      // Refresh the tenant list
      await fetchTenants()
    } catch (error) {
      console.error('Error regenerating API key:', error)
      setError(error instanceof Error ? error.message : 'Failed to regenerate API key')
    }
  }
  const handleDeleteConfirm = async () => {
    if (!tenantToDelete || !token) return

    try {
      await apiClient.deleteTenant(token, tenantToDelete.tenantId)
      setShowDeleteConfirm(false)
      setTenantToDelete(null)
      fetchTenants()
    } catch (err: any) {
      console.error('[Tenants] Error deleting tenant:', err)
      setError(err.message || 'Failed to delete tenant')
    }
  }

  const handleSave = async (tenant: Tenant) => {
    if (!token) return

    try {
      if (modalMode === 'create') {
        const createdTenant = await apiClient.createTenant(token, tenant)
        setShowModal(false)
        setSelectedTenant(null)
        
        // Show the generated API key (only shown once)
        if (createdTenant.apiKey) {
          setGeneratedApiKey(createdTenant.apiKey)
          setShowApiKeyModal(true)
        }
        
        fetchTenants()
      } else {
        await apiClient.updateTenant(token, tenant.tenantId, tenant)
        setShowModal(false)
        setSelectedTenant(null)
        fetchTenants()
      }
    } catch (err: any) {
      console.error('[Tenants] Error saving tenant:', err)
      setError(err.message || 'Failed to save tenant')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-neutral-600">Loading tenants...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card bg-red-50 border-red-200">
        <p className="text-red-800">{error}</p>
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="card bg-amber-50 border-amber-200">
        <div className="flex items-start space-x-3">
          <svg className="w-6 h-6 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-amber-900">Access Restricted</h3>
            <p className="mt-1 text-amber-800">Only SuperAdmin users can manage tenants.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Tenants</h1>
            <p className="text-neutral-600 mt-1">
              Manage all tenants in the system
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="btn btn-primary flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Tenant
          </button>
        </div>

        {/* Tenants Table */}
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Tenant ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {tenants.map((tenant) => (
                <tr key={tenant.tenantId} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-900">{tenant.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-600">{tenant.tenantId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tenant.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(tenant)}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(tenant)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-neutral-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-lg font-medium text-neutral-900 mb-1">No tenants found</p>
                      <p className="text-neutral-600">Get started by creating a new tenant.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <TenantModal
          mode={modalMode}
          tenant={selectedTenant}
          onSave={handleSave}
          onRegenerateApiKey={handleRegenerateApiKey}
          onClose={() => {
            setShowModal(false)
            setSelectedTenant(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && tenantToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Delete Tenant</h3>
            <p className="text-neutral-600 mb-6">
              Are you sure you want to delete <strong>{tenantToDelete.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setTenantToDelete(null)
                }}
                className="px-4 py-2 border border-neutral-300 rounded-md text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Display Modal (One-Time View) */}
      {showApiKeyModal && generatedApiKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
            <div className="flex items-start space-x-3 mb-4">
              <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">API Key Generated</h3>
                <p className="text-sm text-amber-800 mt-1">
                  ⚠️ This is the only time you'll be able to view this API key. Please copy it now and store it securely.
                </p>
              </div>
            </div>
            
            <div className="bg-neutral-50 border border-neutral-200 rounded-md p-4 mb-4">
              <label className="block text-xs font-medium text-neutral-700 mb-2">API Key</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-white border border-neutral-300 rounded px-3 py-2 text-sm font-mono text-neutral-900 break-all">
                  {generatedApiKey}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedApiKey)
                    // Optional: Add a toast notification here
                    const btn = document.activeElement as HTMLButtonElement
                    const originalText = btn.textContent
                    btn.textContent = '✓ Copied!'
                    setTimeout(() => {
                      btn.textContent = originalText
                    }, 2000)
                  }}
                  className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 whitespace-nowrap text-sm"
                  title="Copy to clipboard"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> Store this API key securely. You'll need it to authenticate API requests for this tenant. 
                If you lose it, you'll need to regenerate a new one.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowApiKeyModal(false)
                  setGeneratedApiKey(null)
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                I've Saved It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Tenant Modal Component
function TenantModal({
  mode,
  tenant,
  onSave,
  onRegenerateApiKey,
  onClose,
}: {
  mode: 'create' | 'edit'
  tenant: Tenant | null
  onSave: (tenant: Tenant) => void
  onRegenerateApiKey?: (tenantId: string) => void
  onClose: () => void
}) {
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)
  const [formData, setFormData] = useState<Tenant>(
    tenant || {
      id: '',
      tenantId: '',
      name: '',
      plan: 'standard',
      status: 'active',
      apiKey: '',
      apiKeyHash: '',
      apiKeyMeta: {
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        theme: 'default',
        language: 'en',
        maxUsers: 10,
        features: {
          forms: true,
          pages: true,
          analytics: false,
          canCreateTenants: false,
          canDeleteTenants: false,
          canManageAllContent: false,
          canViewAllTenants: false,
        },
        allowedOrigins: [],
      },
      contact: {
        email: '',
        phone: '',
      },
      billing: {
        cycle: 'monthly',
        nextInvoice: '',
      },
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Ensure tenant ID is set (use provided value or generate from name)
    if (mode === 'create') {
      if (!formData.tenantId) {
        const generatedId = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
        formData.tenantId = generatedId
      }
      // Ensure id matches tenantId
      formData.id = formData.tenantId
    }
    
    // Clean up billing nextInvoice - convert empty string to proper date or null
    const cleanedData = {
      ...formData,
      billing: {
        ...formData.billing,
        nextInvoice: formData.billing.nextInvoice || null as any, // Convert empty string to null for backend
      }
    }
    
    onSave(cleanedData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 my-8">
        <div className="p-6 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">
            {mode === 'create' ? 'Create New Tenant' : 'Edit Tenant'}
          </h3>
          {mode === 'create' && (
            <p className="text-sm text-neutral-600 mt-1">
              An API key will be automatically generated and displayed after creation.
            </p>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Tenant Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Acme Corporation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Tenant ID {mode === 'create' && '*'}
            </label>
            {mode === 'create' ? (
              <>
                <input
                  type="text"
                  required
                  value={formData.tenantId}
                  onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="acme-corp"
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
                value={formData.tenantId}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-neutral-50 text-neutral-500"
              />
            )}
          </div>

          {mode === 'edit' && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-amber-900 mb-1">API Key Management</h4>
                    <p className="text-sm text-amber-800 mb-3">
                      Generate a new API key for this tenant. The current key will be immediately invalidated and cannot be recovered.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowRegenerateConfirm(true)}
                      className="px-3 py-1.5 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm font-medium"
                    >
                      Generate New API Key
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Regenerate API Key Confirmation */}
              {showRegenerateConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
                  <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                    <h4 className="text-lg font-semibold text-neutral-900 mb-4">Regenerate API Key?</h4>
                    <p className="text-neutral-600 mb-6">
                      This will generate a new API key and <strong>immediately invalidate the current one</strong>. 
                      Any applications using the old key will stop working until updated with the new key.
                    </p>
                    <div className="flex space-x-3 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowRegenerateConfirm(false)}
                        className="px-4 py-2 border border-neutral-300 rounded-md text-neutral-700 hover:bg-neutral-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowRegenerateConfirm(false)
                          if (onRegenerateApiKey) {
                            onRegenerateApiKey(formData.tenantId)
                            onClose()  // Close the edit modal
                          }
                        }}
                        className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
                      >
                        Regenerate Key
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Plan
              </label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="free">Free</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Theme
              </label>
              <select
                value={formData.settings.theme}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: { ...formData.settings, theme: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="default">Default</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Language
              </label>
              <select
                value={formData.settings.language}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: { ...formData.settings, language: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.contact.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact: { ...formData.contact, email: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="contact@acme.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.contact.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact: { ...formData.contact, phone: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Max Users
            </label>
            <input
              type="number"
              min="1"
              value={formData.settings.maxUsers}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  settings: { ...formData.settings, maxUsers: parseInt(e.target.value) || 1 },
                })
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Features
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.settings.features.forms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        features: { ...formData.settings.features, forms: e.target.checked },
                      },
                    })
                  }
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Forms</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.settings.features.pages}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        features: { ...formData.settings.features, pages: e.target.checked },
                      },
                    })
                  }
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Pages</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.settings.features.analytics}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        features: { ...formData.settings.features, analytics: e.target.checked },
                      },
                    })
                  }
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Analytics</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.settings.features.canCreateTenants}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        features: { ...formData.settings.features, canCreateTenants: e.target.checked },
                      },
                    })
                  }
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Create Tenants</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.settings.features.canDeleteTenants}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        features: { ...formData.settings.features, canDeleteTenants: e.target.checked },
                      },
                    })
                  }
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Delete Tenants</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.settings.features.canManageAllContent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        features: { ...formData.settings.features, canManageAllContent: e.target.checked },
                      },
                    })
                  }
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">Manage All Content</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.settings.features.canViewAllTenants}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        features: { ...formData.settings.features, canViewAllTenants: e.target.checked },
                      },
                    })
                  }
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700">View All Tenants</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Allowed Origins (CORS)
            </label>
            <textarea
              value={formData.settings.allowedOrigins.join('\n')}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  settings: {
                    ...formData.settings,
                    allowedOrigins: e.target.value.split('\n').filter(origin => origin.trim() !== ''),
                  },
                })
              }
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              placeholder="https://example.com&#10;https://app.example.com"
            />
            <p className="text-xs text-neutral-500 mt-1">Enter one origin per line</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Billing Cycle
              </label>
              <select
                value={formData.billing.cycle}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billing: { ...formData.billing, cycle: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Next Invoice Date
              </label>
              <input
                type="date"
                value={formData.billing.nextInvoice || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    billing: { ...formData.billing, nextInvoice: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex space-x-3 justify-end pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-300 rounded-md text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              {mode === 'create' ? 'Create' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
