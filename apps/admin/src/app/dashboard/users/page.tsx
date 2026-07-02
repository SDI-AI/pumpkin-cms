'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AdminUser, apiClient, CreateAdminUserRequest, UpdateAdminUserRequest } from '@/lib/api'

const allRoles = ['SuperAdmin', 'TenantAdmin', 'Editor', 'Viewer']

type ModalMode = 'create' | 'edit'

export default function UsersPage() {
  const { token, user, currentTenant } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode>('create')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [resetUser, setResetUser] = useState<AdminUser | null>(null)
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null)

  const canManageUsers = user?.role === 'SuperAdmin' || user?.role === 'TenantAdmin'
  const tenantId = currentTenant?.tenantId || ''

  const roles = useMemo(() => {
    return user?.role === 'SuperAdmin'
      ? allRoles
      : allRoles.filter((role) => role !== 'SuperAdmin')
  }, [user?.role])

  const fetchUsers = useCallback(async () => {
    if (!token || !tenantId) return

    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.getUsers(token, tenantId)
      setUsers(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [token, tenantId])

  useEffect(() => {
    if (token && tenantId && canManageUsers) {
      fetchUsers()
    } else {
      setLoading(false)
    }
  }, [token, tenantId, canManageUsers, fetchUsers])

  const handleCreate = () => {
    setModalMode('create')
    setSelectedUser(null)
    setShowUserModal(true)
  }

  const handleEdit = (adminUser: AdminUser) => {
    setModalMode('edit')
    setSelectedUser(adminUser)
    setShowUserModal(true)
  }

  const handleSave = async (request: CreateAdminUserRequest | UpdateAdminUserRequest) => {
    if (!token || !tenantId) return

    try {
      setSaving(true)
      setError(null)

      if (modalMode === 'create') {
        await apiClient.createUser(token, tenantId, request as CreateAdminUserRequest)
      } else if (selectedUser) {
        await apiClient.updateUser(token, tenantId, selectedUser.id, request as UpdateAdminUserRequest)
      }

      setShowUserModal(false)
      setSelectedUser(null)
      await fetchUsers()
    } catch (err: any) {
      setError(err.message || 'Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async (password: string) => {
    if (!token || !tenantId || !resetUser) return

    try {
      setSaving(true)
      setError(null)
      await apiClient.resetUserPassword(token, tenantId, resetUser.id, password)
      setResetUser(null)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!token || !tenantId || !deleteUser) return

    try {
      setSaving(true)
      setError(null)
      await apiClient.deleteUser(token, tenantId, deleteUser.id)
      setDeleteUser(null)
      await fetchUsers()
    } catch (err: any) {
      setError(err.message || 'Failed to delete user')
    } finally {
      setSaving(false)
    }
  }

  if (!canManageUsers) {
    return (
      <div className="card bg-amber-50 border-amber-200">
        <h1 className="text-lg font-semibold text-amber-900">Access Restricted</h1>
        <p className="mt-1 text-amber-800">Only SuperAdmin and TenantAdmin users can manage users.</p>
      </div>
    )
  }

  if (!currentTenant) {
    return (
      <div className="card">
        <h1 className="text-lg font-semibold text-neutral-900">No Tenant Selected</h1>
        <p className="mt-1 text-neutral-600">Select a tenant to manage users.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-neutral-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Users</h1>
          <p className="text-neutral-600 mt-1">{currentTenant.name}</p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary">
          New User
        </button>
      </div>

      {error && (
        <div className="card bg-red-50 border-red-200 text-red-800">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Last Login</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {users.map((adminUser) => (
              <tr key={adminUser.id} className="hover:bg-neutral-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-neutral-900">{adminUser.username}</div>
                  <div className="text-sm text-neutral-600">{adminUser.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {adminUser.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    adminUser.isActive ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-700'
                  }`}>
                    {adminUser.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                  {adminUser.lastLogin ? new Date(adminUser.lastLogin).toLocaleString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  <button onClick={() => handleEdit(adminUser)} className="text-primary-600 hover:text-primary-900">
                    Edit
                  </button>
                  <button onClick={() => setResetUser(adminUser)} className="text-amber-600 hover:text-amber-900">
                    Password
                  </button>
                  <button
                    onClick={() => setDeleteUser(adminUser)}
                    disabled={adminUser.id === user?.id}
                    className="text-red-600 hover:text-red-900 disabled:text-neutral-300 disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg font-medium text-neutral-900 mb-1">No users found</p>
            <p className="text-neutral-600">Create the first user for this tenant.</p>
          </div>
        )}
      </div>

      {showUserModal && (
        <UserModal
          mode={modalMode}
          user={selectedUser}
          roles={roles}
          saving={saving}
          onClose={() => setShowUserModal(false)}
          onSave={handleSave}
        />
      )}

      {resetUser && (
        <PasswordModal
          user={resetUser}
          saving={saving}
          onClose={() => setResetUser(null)}
          onSave={handleResetPassword}
        />
      )}

      {deleteUser && (
        <ConfirmModal
          title="Delete User"
          message={`Delete ${deleteUser.username}? This cannot be undone.`}
          saving={saving}
          onCancel={() => setDeleteUser(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}

function UserModal({
  mode,
  user,
  roles,
  saving,
  onClose,
  onSave,
}: {
  mode: ModalMode
  user: AdminUser | null
  roles: string[]
  saving: boolean
  onClose: () => void
  onSave: (request: CreateAdminUserRequest | UpdateAdminUserRequest) => void
}) {
  const [email, setEmail] = useState(user?.email || '')
  const [username, setUsername] = useState(user?.username || '')
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [role, setRole] = useState(user?.role || roles[roles.length - 1] || 'Viewer')
  const [isActive, setIsActive] = useState(user?.isActive ?? true)
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()

    if (mode === 'create' && password.length < 8) {
      setFormError('Password must be at least 8 characters')
      return
    }

    const base = {
      email,
      username,
      role,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      isActive,
      permissions: user?.permissions ?? [],
    }

    onSave(mode === 'create' ? { ...base, password } : base)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">{mode === 'create' ? 'Create User' : 'Edit User'}</h3>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {formError && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">{formError}</div>}

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-neutral-700 mb-1">First Name</span>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-neutral-700 mb-1">Last Name</span>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="input" />
            </label>
          </div>

          <label className="block">
            <span className="block text-sm font-medium text-neutral-700 mb-1">Email *</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-neutral-700 mb-1">Username *</span>
            <input required value={username} onChange={(e) => setUsername(e.target.value)} className="input" />
          </label>

          {mode === 'create' && (
            <label className="block">
              <span className="block text-sm font-medium text-neutral-700 mb-1">Password *</span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
            </label>
          )}

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-neutral-700 mb-1">Role</span>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="input">
                {roles.map((roleName) => (
                  <option key={roleName} value={roleName}>{roleName}</option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 pt-7">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-neutral-700">Active</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PasswordModal({
  user,
  saving,
  onClose,
  onSave,
}: {
  user: AdminUser
  saving: boolean
  onClose: () => void
  onSave: (password: string) => void
}) {
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters')
      return
    }

    onSave(password)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900">Reset Password</h3>
          <p className="text-sm text-neutral-600 mt-1">{user.email}</p>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {formError && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">{formError}</div>}
          <label className="block">
            <span className="block text-sm font-medium text-neutral-700 mb-1">New Password</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Reset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfirmModal({
  title,
  message,
  saving,
  onCancel,
  onConfirm,
}: {
  title: string
  message: string
  saving: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        <p className="text-neutral-600 mt-2">{message}</p>
        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={saving}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-60" disabled={saving}>
            {saving ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
