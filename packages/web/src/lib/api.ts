import { API_ROUTES } from '@clinikchat/shared'
import axios from 'axios'

import { useAuthStore } from '../store/auth.store'
import { disconnectSocket } from './socket'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  withCredentials: true
})

let isRefreshing = false
let pendingQueue: Array<(token: string | null) => void> = []

function resolvePendingQueue(token: string | null): void {
  for (const callback of pendingQueue) {
    callback(token)
  }
  pendingQueue = []
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined
    const status = error.response?.status as number | undefined

    if (status !== 401 || originalRequest?._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((token) => {
          if (!token) {
            reject(error)
            return
          }
          originalRequest.headers.Authorization = `Bearer ${token}`
          resolve(api(originalRequest))
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const refreshResponse = await api.post(API_ROUTES.auth.refresh)
      const token = refreshResponse.data?.data?.accessToken as string | undefined
      useAuthStore.getState().updateAccessToken(token ?? null)
      resolvePendingQueue(token ?? null)

      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      }

      throw error
    } catch (refreshError) {
      useAuthStore.getState().clearSession()
      disconnectSocket()
      resolvePendingQueue(null)
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export { api }
