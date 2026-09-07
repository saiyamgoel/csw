import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { usersApi } from '@/api/users'
import { useAuthStore } from '@/store/authStore'

export function ProfilePage() {
  const { user } = useAuthStore()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwChanged, setPwChanged] = useState(false)

  const mutation = useMutation({
    mutationFn: () => usersApi.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
    onSuccess: () => {
      setPwChanged(true)
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    },
  })

  const canSubmit = form.currentPassword && form.newPassword && form.newPassword === form.confirmPassword && form.newPassword.length >= 8

  return (
    <div>
      <PageHeader title="Profile" description="View your profile and change your password" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Account Info</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Full Name</dt>
              <dd className="text-sm font-medium text-gray-900 mt-0.5">{user?.fullName}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Email</dt>
              <dd className="text-sm text-gray-700 mt-0.5">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Roles</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {user?.roles.map(r => (
                  <span key={r} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{r}</span>
                ))}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Change Password</h2>
          {pwChanged ? (
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle size={18} /> Password changed successfully.
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input type="password" value={form.currentPassword}
                  onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" value={form.newPassword}
                  onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input type="password" value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">Passwords do not match.</p>
                )}
              </div>
              {mutation.isError && <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>}
              <button
                onClick={() => mutation.mutate()}
                disabled={!canSubmit || mutation.isPending}
                className="w-full py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                {mutation.isPending ? 'Updating…' : 'Change Password'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
