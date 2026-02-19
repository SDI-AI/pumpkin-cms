'use client'

import { Fragment } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { TenantInfo } from 'pumpkin-ts-models'

export default function TenantSelector() {
  const { currentTenant, availableTenants, setCurrentTenant, user, isLoading } = useAuth()

  // Show loading state
  if (isLoading || (!currentTenant && availableTenants.length === 0)) {
    return (
      <div className="hidden sm:flex items-center px-3 py-1.5 bg-neutral-100 rounded-lg">
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-neutral-300 border-t-primary-500 mr-2"></div>
        <span className="text-sm font-medium text-neutral-500">Loading...</span>
      </div>
    )
  }

  // If only one tenant, don't show selector
  if (availableTenants.length <= 1) {
    return (
      <div className="hidden sm:flex items-center px-3 py-1.5 bg-neutral-100 rounded-lg">
        <svg className="w-4 h-4 text-neutral-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="text-sm font-medium text-neutral-700">{currentTenant?.name || 'No tenant'}</span>
      </div>
    )
  }

  return (
    <div className="relative">
      <select
        value={currentTenant?.tenantId || ''}
        onChange={(e) => {
          const selected = availableTenants.find(t => t.tenantId === e.target.value)
          if (selected) {
            console.log('[TenantSelector] Switching to tenant:', selected.name)
            setCurrentTenant(selected)
            // Let React state updates trigger re-renders instead of hard reload
            // Pages using currentTenant in useEffect will automatically refresh
          }
        }}
        className="appearance-none bg-white border border-neutral-200 rounded-lg px-3 py-1.5 pr-8 text-sm font-medium text-neutral-700 hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors cursor-pointer"
      >
        {availableTenants.map((tenant) => (
          <option key={tenant.tenantId} value={tenant.tenantId}>
            {tenant.name}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}
