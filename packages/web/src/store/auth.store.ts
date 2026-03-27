import { create } from 'zustand'

interface AuthUser {
  id: string
  email: string
  displayName: string
  avatarUrl?: string | null
  status: 'online' | 'away' | 'offline'
}

interface AuthState {
  accessToken: string | null
  user: AuthUser | null
  hydrated: boolean
  setSession: (accessToken: string, user: AuthUser) => void
  updateAccessToken: (accessToken: string | null) => void
  clearSession: () => void
  hydrate: () => void
}

const TOKEN_KEY = 'clinikchat_access_token'
const USER_KEY = 'clinikchat_user'

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  hydrated: false,
  setSession: (accessToken, user) => {
    localStorage.setItem(TOKEN_KEY, accessToken)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ accessToken, user })
  },
  updateAccessToken: (accessToken) => {
    if (accessToken) {
      localStorage.setItem(TOKEN_KEY, accessToken)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
    set({ accessToken })
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    set({ accessToken: null, user: null })
  },
  hydrate: () => {
    const accessToken = localStorage.getItem(TOKEN_KEY)
    const userRaw = localStorage.getItem(USER_KEY)
    let user: AuthUser | null = null

    if (userRaw) {
      try {
        user = JSON.parse(userRaw) as AuthUser
      } catch {
        user = null
      }
    }

    set({ accessToken, user, hydrated: true })
  }
}))
