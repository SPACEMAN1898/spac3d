import type { User } from './user'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  displayName: string
}

export interface TokenPayload {
  sub: string
  email: string
  iat: number
  exp: number
}

export interface AuthResponse {
  user: User
  accessToken: string
}

export interface RefreshResponse {
  accessToken: string
}
