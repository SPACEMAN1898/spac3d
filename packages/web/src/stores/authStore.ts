import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@clinikchat/shared'
import { connectSocket, disconnectSocket } from '../lib/socket'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  login: (user: User, accessToken: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login(user: User, accessToken: string) {
        localStorage.setItem('accessToken', accessToken)
        connectSocket(accessToken)
        set({ user, accessToken, isAuthenticated: true })
      },

      logout() {
        localStorage.removeItem('accessToken')
        disconnectSocket()
        set({ user: null, accessToken: null, isAuthenticated: false })
      },

      updateUser(partial: Partial<User>) {
        const current = get().user
        if (current) {
          set({ user: { ...current, ...partial } })
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken && state.isAuthenticated) {
          localStorage.setItem('accessToken', state.accessToken)
          connectSocket(state.accessToken)
        }
      },
    },
  ),
)
