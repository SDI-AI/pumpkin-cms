'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import type { DashboardStats } from '@/lib/api'

export default function DashboardPage() {
  const { user, token, currentTenant } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchStats() {
      if (!token || !currentTenant) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        
        const dashboardStats = await apiClient.getDashboardStats(token, currentTenant.tenantId)
        setStats(dashboardStats)
      } catch (err: any) {
        console.error('[Dashboard] Failed to load stats:', err)
        setError('Failed to load dashboard statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [token, currentTenant])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-neutral-600">Loading dashboard...</p>
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

  // Calculate percentage changes (mock for now - would need historical data)
  const getChangePercent = (current: number) => {
    // Mock calculation - in real app, compare with previous period
    return current > 0 ? `+${Math.floor(Math.random() * 20) + 5}%` : '0%'
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="card">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          Welcome back, {user?.firstName || user?.username}! 👋
        </h1>
        <p className="text-neutral-600">
          Here's what's happening with {currentTenant?.name || 'your site'} today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Pages"
          value={stats?.totalPages.toString() || '0'}
          change={getChangePercent(stats?.totalPages || 0)}
          trend="up"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          title="Published"
          value={stats?.publishedPages.toString() || '0'}
          change={getChangePercent(stats?.publishedPages || 0)}
          trend="up"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Drafts"
          value={stats?.draftPages.toString() || '0'}
          change={stats && stats.draftPages > 0 ? '-3%' : '0%'}
          trend={stats && stats.draftPages > 0 ? 'down' : 'up'}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
        />
        <StatCard
          title="Media Files"
          value={stats?.mediaFiles.toString() || '0'}
          change={getChangePercent(stats?.mediaFiles || 0)}
          trend="up"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionButton
            title="Create New Page"
            description="Start building a new page"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          />
          <QuickActionButton
            title="Upload Media"
            description="Add images or files"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            }
          />
          <QuickActionButton
            title="View Analytics"
            description="Check site performance"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Recent Activity */}
      {stats?.recentActivity && stats.recentActivity.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {stats.recentActivity.map((activity, index) => (
              <ActivityItemComponent
                key={index}
                title={activity.title}
                time={activity.time}
                user={activity.user}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  change,
  trend,
  icon,
}: {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: React.ReactNode
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
          {icon}
        </div>
        <span
          className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {change}
        </span>
      </div>
      <h3 className="text-2xl font-bold text-neutral-900 mb-1">{value}</h3>
      <p className="text-sm text-neutral-600">{title}</p>
    </div>
  )
}

function QuickActionButton({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <button className="p-6 rounded-xl border-2 border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left group">
      <div className="text-primary-600 group-hover:text-primary-700 mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-neutral-900 mb-1">{title}</h3>
      <p className="text-sm text-neutral-600">{description}</p>
    </button>
  )
}

function ActivityItemComponent({
  title,
  time,
  user,
}: {
  title: string
  time: string
  user: string
}) {
  return (
    <div className="flex items-start space-x-4 p-4 rounded-lg hover:bg-neutral-50 transition-colors">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
        {user.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-neutral-900 font-medium truncate">{title}</p>
        <p className="text-sm text-neutral-600">
          {user} • {time}
        </p>
      </div>
    </div>
  )
}
