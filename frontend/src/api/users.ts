import { client } from './client'
import type { AppUser, Role, PagedResult } from '@/types'

export const usersApi = {
  getAll: (params?: { search?: string; page?: number; pageSize?: number }) =>
    client.get<PagedResult<AppUser>>('/users', { params }).then(r => r.data),

  getById: (id: string) =>
    client.get<AppUser>(`/users/${id}`).then(r => r.data),

  create: (req: { email: string; fullName: string; password: string; roles: string[] }) =>
    client.post<AppUser>('/users', req).then(r => r.data),

  update: (id: string, req: { fullName: string; isActive: boolean }) =>
    client.put<AppUser>(`/users/${id}`, req).then(r => r.data),

  assignRole: (userId: string, roleName: string) =>
    client.post(`/users/${userId}/roles`, { roleName }),

  removeRole: (userId: string, roleId: string) =>
    client.delete(`/users/${userId}/roles/${roleId}`),

  getRoles: () =>
    client.get<Role[]>('/roles').then(r => r.data),

  changePassword: (req: { currentPassword: string; newPassword: string }) =>
    client.put('/auth/me/password', req),
}
