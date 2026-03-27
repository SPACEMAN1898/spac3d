import { API_ROUTES } from '@clinikchat/shared'
import axios from 'axios'
import type { AxiosError } from 'axios'

import { useAuthStore } from '../store/auth'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
})

let isRefreshing = false
let pendingQueue: Array<(token: string | null) => void> = []

const flushQueue = (token: string | null) => {
  pendingQueue.forEach((resolve) => resolve(token))
  pendingQueue = []
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config

    if (!originalRequest || error.response?.status !== 401 || (originalRequest as { _retry?: boolean })._retry) {
      throw error
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

    ;(originalRequest as { _retry?: boolean })._retry = true
    isRefreshing = true

    try {
      const response = await axios.post(`${apiBaseUrl}${API_ROUTES.auth.refresh}`, undefined, {
        withCredentials: true
      })
      const token = response.data.data.tokens.accessToken as string
      const user = response.data.data.user
      useAuthStore.getState().setSession(token, user)
      flushQueue(token)
      originalRequest.headers.Authorization = `Bearer ${token}`
      return api(originalRequest)
    } catch (refreshError) {
      useAuthStore.getState().clearSession()
      flushQueue(null)
      throw refreshError
    } finally {
      isRefreshing = false
    }
  }
)
