'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { UserInfo, TenantInfo } from 'pumpkin-ts-models'
import { apiClient } from '@/lib/api'

interface AuthContextType {
  user: UserInfo | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  currentTenant: TenantInfo | null
  availableTenants: TenantInfo[]
  setCurrentTenant: (tenant: TenantInfo) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'pumpkin_auth_token'
const USER_KEY = 'pumpkin_user'
const CURRENT_TENANT_KEY = 'pumpkin_current_tenant'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTenant, setCurrentTenantState] = useState<TenantInfo | null>(null)
  const [availableTenants, setAvailableTenants] = useState<TenantInfo[]>([])

  // Load tenants when authenticated
  useEffect(() => {
    async function loadTenants() {
      if (!token || !user) {
        console.log('[AuthContext] Skipping tenant load - no token or user')
        return
      }
      
      console.log('[AuthContext] Loading tenants for user:', user.username, 'tenantId:', user.tenantId)
      
      try {
        const tenants = await apiClient.getTenants(token)
        console.log('[AuthContext] Loaded tenants:', tenants)
        setAvailableTenants(tenants)
        
        // Set current tenant from localStorage or default to user's tenant
        const storedTenant = localStorage.getItem(CURRENT_TENANT_KEY)
        if (storedTenant) {
          const parsed = JSON.parse(storedTenant)
          // Verify tenant still exists in available list
          if (tenants.some(t => t.tenantId === parsed.tenantId)) {
            console.log('[AuthContext] Using stored tenant:', parsed.name)
            setCurrentTenantState(parsed)
            return
          }
        }
        
        // Default to user's own tenant
        const userTenant = tenants.find(t => t.tenantId === user.tenantId)
        if (userTenant) {
          console.log('[AuthContext] Using user tenant:', userTenant.name)
          setCurrentTenantState(userTenant)
          localStorage.setItem(CURRENT_TENANT_KEY, JSON.stringify(userTenant))
        } else {
          console.warn('[AuthContext] User tenant not found in available tenants. Available:', tenants.map(t => t.tenantId))
        }
      } catch (error) {
        console.error('[AuthContext] Failed to load tenants:', error)
      }
    }
    
    loadTenants()
  }, [token, user])

  const setCurrentTenant = (tenant: TenantInfo) => {
    setCurrentTenantState(tenant)
    localStorage.setItem(CURRENT_TENANT_KEY, JSON.stringify(tenant))
  }

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY)
        const storedUser = localStorage.getItem(USER_KEY)

        if (storedToken && storedUser) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
          
          // Optionally verify token with API (if endpoint exists)
          // If verification fails, we'll still trust localStorage until an actual API call fails
          try {
            const verifiedUser = await apiClient.verifyToken(storedToken)
            setUser(verifiedUser)
            localStorage.setItem(USER_KEY, JSON.stringify(verifiedUser))
          } catch (error) {
            // Token verification endpoint may not exist - that's OK
            // We'll trust localStorage and let actual API calls handle auth errors
            console.log('[AuthContext] Token verification skipped (endpoint may not exist)')
          }
        }
      } catch (error) {
        console.error('Error loading auth state:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password)
      
      setToken(response.token)
      setUser(response.user)
      
      localStorage.setItem(TOKEN_KEY, response.token)
      localStorage.setItem(USER_KEY, JSON.stringify(response.user))
    } catch (error: any) {
      console.error('Login error:', error)
      throw new Error(error.message || 'Login failed')
    }
  }

  const logout = async () => {
    try {
      if (token) {
        await apiClient.logout(token)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setToken(null)
      setUser(null)
      setCurrentTenantState(null)
      setAvailableTenants([])
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(CURRENT_TENANT_KEY)
    }
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    currentTenant,
    availableTenants,
    setCurrentTenant,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
