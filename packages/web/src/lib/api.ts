import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

const API_BASE = '/api/v1'

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})

// Attach JWT token to every request
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

// Refresh token on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error)

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`
            resolve(apiClient(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await axios.post<{ success: boolean; data: { accessToken: string } }>(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true },
        )
        const newToken = response.data.data.accessToken
        localStorage.setItem('accessToken', newToken)

        refreshQueue.forEach((cb) => cb(newToken))
        refreshQueue = []

        originalRequest.headers['Authorization'] = `Bearer ${newToken}`
        return apiClient(originalRequest)
      } catch {
        refreshQueue = []
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default apiClient
