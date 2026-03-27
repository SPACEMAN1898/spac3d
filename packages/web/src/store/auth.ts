import type { User } from '@clinikchat/shared'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { connectSocket, disconnectSocket } from '../lib/socket'

interface AuthState {
  token: string | null
  user: User | null
  setSession: (token: string, user: User) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => {
        connectSocket(token)
        set({ token, user })
      },
      clearSession: () => {
        disconnectSocket()
        set({ token: null, user: null })
      }
    }),
    {
      name: 'clinikchat-auth'
    }
  )
)
