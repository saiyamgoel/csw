import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Modal } from '@/components/shared/Modal'
import { EmptyState } from '@/components/shared/EmptyState'
import { Pagination } from '@/components/shared/Pagination'
import { usersApi } from '@/api/users'
import type { AppUser } from '@/types'

const AVAILABLE_ROLES = ['Administrator', 'InventoryUser', 'ProductionUser', 'ManagementUser']

function UserFormModal({ open, onClose, user }: { open: boolean; onClose: () => void; user?: AppUser }) {
  const qc = useQueryClient()
  const isEdit = !!user
  const [form, setForm] = useState({
    email: user?.email ?? '',
    fullName: user?.fullName ?? '',
    password: '',
    roles: user?.roles ?? [] as string[],
    isActive: user?.isActive ?? true,
  })
  const [error, setError] = useState('')

  const { data: allRoles } = useQuery({ queryKey: ['roles'], queryFn: usersApi.getRoles })
  const roleIdByName = Object.fromEntries((allRoles ?? []).map(r => [r.name, r.id]))

  const handleSave = async () => {
    setError('')
    try {
      if (isEdit) {
        await usersApi.update(user!.id, { fullName: form.fullName, isActive: form.isActive })
        const prevRoles = user!.roles
        const toAdd = form.roles.filter(r => !prevRoles.includes(r))
        const toRemove = prevRoles.filter(r => !form.roles.includes(r))
        for (const r of toAdd) await usersApi.assignRole(user!.id, r)
        for (const r of toRemove) {
          const rid = roleIdByName[r]
          if (rid) await usersApi.removeRole(user!.id, rid)
        }
      } else {
        await usersApi.create({ email: form.email, fullName: form.fullName, password: form.password, roles: form.roles })
      }
      qc.invalidateQueries({ queryKey: ['users'] })
      onClose()
    } catch (e: any) {
      setError(e.message ?? 'Save failed')
    }
  }

  const toggleRole = (r: string) =>
    setForm(f => ({ ...f, roles: f.roles.includes(r) ? f.roles.filter(x => x !== r) : [...f.roles, r] }))

  return (
    <Modal open={open} title={isEdit ? 'Edit User' : 'Create User'} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        {!isEdit && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
          <div className="space-y-1">
            {AVAILABLE_ROLES.map(r => (
              <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.roles.includes(r)} onChange={() => toggleRole(r)} />
                {r}
              </label>
            ))}
          </div>
        </div>
        {isEdit && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
            Active
          </label>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!form.fullName || (!isEdit && (!form.email || !form.password))}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
            Save
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function UsersPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(false)
  const [editUser, setEditUser] = useState<AppUser | undefined>()

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => usersApi.getAll({ page, pageSize: 25 }),
  })

  const openCreate = () => { setEditUser(undefined); setModal(true) }
  const openEdit = (u: AppUser) => { setEditUser(u); setModal(true) }

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage system users and role assignments"
        action={
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700">
            <Plus size={16} /> Add User
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Roles</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50">
                {Array.from({ length: 5 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                ))}
              </tr>
            ))}
            {!isLoading && data?.data.length === 0 && (
              <tr><td colSpan={5}><EmptyState message="No users found." /></td></tr>
            )}
            {!isLoading && data?.data.map(u => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.fullName}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map(r => (
                      <span key={r} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{r}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(u)} className="text-gray-400 hover:text-brand-600"><Pencil size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={page} pageSize={25} total={data.total} onChange={setPage} />}
      <UserFormModal open={modal} onClose={() => setModal(false)} user={editUser} />
    </div>
  )
}
