import type { User } from './user'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest extends LoginRequest {
  displayName: string
}

export interface TokenPayload {
  sub: string
  email: string
  displayName: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
}
