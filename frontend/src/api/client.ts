import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

export const client = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
    }
    // Propagate server error message if available
    const msg = error.response?.data?.error || error.response?.data?.message || error.response?.data?.title || error.message
    return Promise.reject(new Error(msg))
  }
)

export const apiClient = client
