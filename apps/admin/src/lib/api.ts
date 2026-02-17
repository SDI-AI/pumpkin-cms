import { LoginRequest, LoginResponse, UserInfo, Page, Tenant, TenantInfo } from 'pumpkin-ts-models'

export interface DashboardStats {
  totalPages: number
  publishedPages: number
  draftPages: number
  mediaFiles: number
  recentActivity: ActivityItem[]
}

export interface ActivityItem {
  title: string
  time: string
  user: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5064'
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || ''

interface ApiError {
  message: string
  status: number
  details?: any
}

class ApiClient {
  private baseUrl: string
  private apiKey: string

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...options.headers,
    }

    const config: RequestInit = {
      ...options,
      headers,
    }

    console.log('[API Client] Request:', {
      url,
      method: config.method || 'GET',
      hasApiKey: !!this.apiKey,
      apiKeyPreview: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'none'
    })

    try {
      const response = await fetch(url, config)
      
      console.log('[API Client] Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })
      
      if (!response.ok) {
        let errorData: any = {}
        const contentType = response.headers.get('content-type')
        
        if (contentType?.includes('application/json')) {
          errorData = await response.json().catch(() => ({}))
        } else {
          const text = await response.text().catch(() => '')
          errorData = { message: text || response.statusText }
        }
        
        console.error('[API Client] Error response:', errorData)
        
        const errorMessage = errorData.message || 
                           errorData.error || 
                           errorData.title ||
                           `HTTP ${response.status}: ${response.statusText}`
        
        throw {
          message: errorMessage,
          status: response.status,
          details: errorData
        } as ApiError
      }

      const data = await response.json()
      console.log('[API Client] Success:', data)
      return data
    } catch (error) {
      if ((error as ApiError).status) {
        throw error
      }
      console.error('[API Client] Network error:', error)
      throw {
        message: 'Network error. Please check your connection and ensure the API is accessible.',
        status: 0,
      } as ApiError
    }
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const loginRequest: LoginRequest = { email, password }
    
    return this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginRequest),
    })
  }

  async verifyToken(token: string): Promise<UserInfo> {
    return this.request<UserInfo>('/api/auth/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  async logout(token: string): Promise<void> {
    return this.request<void>('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  // Get tenants accessible to the authenticated user
  async getTenants(token: string): Promise<Tenant[]> {
    console.log('[API Client] Getting tenants...')
    const response = await this.request<{ tenants: Tenant[], count: number }>(
      '/api/admin/tenants',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )
    
    console.log('[API Client] Tenants response:', response)
    return response.tenants
  }

  // Create a new tenant (requires authentication and SuperAdmin role)
  async createTenant(token: string, tenant: Tenant): Promise<Tenant> {
    console.log('[API Client] Creating tenant...')
    const response = await this.request<Tenant>(
      '/api/admin/tenants',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(tenant),
      }
    )
    
    console.log('[API Client] Tenant created:', response)
    return response
  }

  // Update an existing tenant (requires authentication and SuperAdmin role)
  async updateTenant(token: string, tenantId: string, tenant: Tenant): Promise<Tenant> {
    console.log('[API Client] Updating tenant:', tenantId)
    const response = await this.request<Tenant>(
      `/api/admin/tenants/${tenantId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(tenant),
      }
    )
    
    console.log('[API Client] Tenant updated:', response)
    return response
  }

  // Regenerate tenant API key (requires authentication and SuperAdmin role)
  async regenerateTenantApiKey(token: string, tenantId: string): Promise<{ tenant: Tenant; apiKey: string }> {
    console.log('[API Client] Regenerating API key for tenant:', tenantId)
    const response = await this.request<{ tenant: Tenant; apiKey: string }>(
      `/api/admin/tenants/${tenantId}/regenerate-api-key`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )
    
    console.log('[API Client] API key regenerated')
    return response
  }

  // Delete a tenant (requires authentication and SuperAdmin role)
  async deleteTenant(token: string, tenantId: string): Promise<{ message: string; tenantId: string }> {
    console.log('[API Client] Deleting tenant:', tenantId)
    const response = await this.request<{ message: string; tenantId: string }>(
      `/api/admin/tenants/${tenantId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )
    
    console.log('[API Client] Tenant deleted:', response)
    return response
  }

  // Get all pages for a tenant (requires authentication)
  async getPages(token: string, tenantId: string): Promise<Page[]> {
    const response = await this.request<{ pages: Page[], count: number, tenantId: string }>(
      `/api/admin/pages?tenantId=${tenantId}`, 
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )
    return response.pages
  }

  // Get a single page by slug (requires authentication)
  async getPage(token: string, tenantId: string, pageSlug: string): Promise<Page> {
    const response = await this.request<Page>(
      `/api/pages/${tenantId}/${encodeURIComponent(pageSlug)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )
    return response
  }

  // Get dashboard statistics
  async getDashboardStats(token: string, tenantId: string): Promise<DashboardStats> {
    const pages = await this.getPages(token, tenantId)
    
    const totalPages = pages.length
    const publishedPages = pages.filter(p => p.isPublished).length
    const draftPages = pages.filter(p => !p.isPublished).length
    
    // Count unique media referenced in pages (simplified - counts image references in content)
    const mediaCount = this.countMediaReferences(pages)
    
    return {
      totalPages,
      publishedPages,
      draftPages,
      mediaFiles: mediaCount,
      recentActivity: this.getRecentActivity(pages),
    }
  }

  private countMediaReferences(pages: Page[]): number {
    // This is a simplified count - in a real app you'd query a media library
    // For now, just estimate based on content blocks
    let count = 0
    pages.forEach(page => {
      if (page.ContentData?.ContentBlocks) {
        page.ContentData.ContentBlocks.forEach(block => {
          if (block.type === 'Gallery' || block.type === 'Hero') {
            count += 1
          }
        })
      }
    })
    return count
  }

  private getRecentActivity(pages: Page[]): ActivityItem[] {
    const activities: ActivityItem[] = []
    
    // Sort pages by updatedAt
    const sortedPages = [...pages]
      .sort((a, b) => {
        const dateA = new Date(a.MetaData?.updatedAt || 0).getTime()
        const dateB = new Date(b.MetaData?.updatedAt || 0).getTime()
        return dateB - dateA
      })
      .slice(0, 5)
    
    sortedPages.forEach(page => {
      const wasPublished = page.publishedAt && 
        new Date(page.publishedAt).getTime() > new Date(page.MetaData?.updatedAt || 0).getTime() - 60000
      
      activities.push({
        title: wasPublished ? `${page.MetaData?.title || page.pageSlug} published` : `${page.MetaData?.title || page.pageSlug} updated`,
        time: this.getRelativeTime(page.MetaData?.updatedAt || page.publishedAt || new Date().toISOString()),
        user: page.MetaData?.author || 'Unknown',
      })
    })
    
    return activities
  }

  private getRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    return `${days} day${days !== 1 ? 's' : ''} ago`
  }

  // Helper method to create an authenticated client
  withAuth(token: string): ApiClient {
    const client = new ApiClient(this.baseUrl, this.apiKey)
    client.setAuthToken(token)
    return client
  }

  private authToken?: string

  private setAuthToken(token: string) {
    this.authToken = token
  }

  // Override request to include auth token if available
  async authenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (this.authToken) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${this.authToken}`,
      }
    }
    return this.request<T>(endpoint, options)
  }
}

export const apiClient = new ApiClient(API_URL, API_KEY)
export type { ApiError }
