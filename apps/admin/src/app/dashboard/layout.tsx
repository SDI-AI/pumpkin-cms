'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Box,
  Building2,
  FileText,
  Gauge,
  LogOut,
  Map,
  Palette,
  Users,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import TenantSelector from '@/components/TenantSelector'

interface NavItem {
  name: string
  href: string
  icon: ReactNode
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <Gauge className="h-5 w-5" aria-hidden="true" />,
  },
  {
    name: 'Pages',
    href: '/dashboard/pages',
    icon: <FileText className="h-5 w-5" aria-hidden="true" />,
  },
  {
    name: 'Page Map',
    href: '/dashboard/page-map',
    icon: <Map className="h-5 w-5" aria-hidden="true" />,
  },
  {
    name: 'Themes',
    href: '/dashboard/themes',
    icon: <Palette className="h-5 w-5" aria-hidden="true" />,
  },
  {
    name: 'Users',
    href: '/dashboard/users',
    icon: <Users className="h-5 w-5" aria-hidden="true" />,
  },
  {
    name: 'Tenants',
    href: '/dashboard/tenants',
    icon: <Building2 className="h-5 w-5" aria-hidden="true" />,
  },
  {
    name: 'Icons',
    href: '/dashboard/icons',
    icon: <Box className="h-5 w-5" aria-hidden="true" />,
  },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-neutral-50">
        {/* Top Navigation Bar */}
        <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
          <div className="px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-3">
                  <Palette className="h-8 w-8 text-primary-600" aria-hidden="true" />
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-neutral-900">Pumpkin CMS</span>
                    <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">v1.0</span>
                  </div>
                </div>

                {/* Navigation Links */}
                <nav className="hidden md:flex items-center space-x-1">
                  {navigation.map((item) => {
                    const isActive = item.href === '/dashboard'
                      ? pathname === '/dashboard'
                      : pathname === item.href || pathname?.startsWith(`${item.href}/`)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        {item.icon}
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
              
              {/* Tenant Selector + User Menu */}
              <div className="flex items-center space-x-4">
                <TenantSelector />
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-neutral-900">{user?.username || 'User'}</p>
                  <p className="text-xs text-neutral-500">{user?.role || 'Role'}</p>
                </div>
                <button
                  onClick={logout}
                  className="btn btn-secondary inline-flex items-center gap-2 text-sm"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden border-t border-neutral-200">
            <nav className="px-4 py-2 flex items-center space-x-1 overflow-x-auto">
              {navigation.map((item) => {
                const isActive = item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname === item.href || pathname?.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </header>

        {/* Page Content */}
        <main className="px-6 lg:px-8 py-8 w-full">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}
