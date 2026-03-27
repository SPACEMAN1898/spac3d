import { ERROR_CODES } from '@clinikchat/shared'
import type { AuthResponse, LoginRequest, RegisterRequest, TokenPayload } from '@clinikchat/shared'

import { ChannelType, MemberRole } from '../generated/prisma/enums.js'
import { AppError } from '../lib/errors.js'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../lib/jwt.js'
import { comparePassword, hashPassword } from '../lib/password.js'
import { prisma } from '../lib/prisma.js'

const DEFAULT_CHANNEL_NAME = 'general'

const buildPayload = (user: { id: string; email: string; displayName: string }): TokenPayload => ({
  sub: user.id,
  email: user.email,
  displayName: user.displayName
})

const toUser = (user: {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  status: 'ONLINE' | 'AWAY' | 'OFFLINE'
  lastSeenAt: Date | null
  createdAt: Date
  updatedAt: Date
}) => ({
  ...user,
  status: user.status.toLowerCase() as 'online' | 'away' | 'offline',
  lastSeenAt: user.lastSeenAt?.toISOString() ?? null,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString()
})

const persistRefreshToken = async (userId: string, token: string) => {
  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  })
}

export const register = async (input: RegisterRequest): Promise<AuthResponse> => {
  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } })

  if (existing) {
    throw new AppError(409, ERROR_CODES.CONFLICT, 'An account with this email already exists')
  }

  const passwordHash = await hashPassword(input.password)
  const slugBase = input.displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'workspace'
  const slug = `${slugBase}-${Math.random().toString(36).slice(2, 8)}`

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      displayName: input.displayName.trim(),
      passwordHash,
      lastSeenAt: new Date()
    }
  })

  await prisma.organization.create({
    data: {
      name: `${user.displayName.split(' ')[0] ?? user.displayName}'s workspace`,
      slug,
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: MemberRole.OWNER
        }
      },
      channels: {
        create: {
          name: DEFAULT_CHANNEL_NAME,
          type: ChannelType.PUBLIC,
          createdById: user.id,
          members: {
            create: {
              userId: user.id,
              role: MemberRole.OWNER
            }
          }
        }
      }
    }
  })

  const payload = buildPayload(user)
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  await persistRefreshToken(user.id, refreshToken)

  return {
    user: toUser(user),
    tokens: { accessToken, refreshToken }
  }
}

export const login = async (input: LoginRequest): Promise<AuthResponse> => {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } })

  if (!user || !(await comparePassword(input.password, user.passwordHash))) {
    throw new AppError(401, ERROR_CODES.AUTH_INVALID_CREDENTIALS, 'Invalid email or password')
  }

  const payload = buildPayload(user)
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  await persistRefreshToken(user.id, refreshToken)
  await prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } })

  return {
    user: toUser(user),
    tokens: { accessToken, refreshToken }
  }
}

export const refreshSession = async (refreshToken: string): Promise<AuthResponse> => {
  let payload: TokenPayload

  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw new AppError(401, ERROR_CODES.AUTH_REFRESH_INVALID, 'Invalid refresh token')
  }

  const storedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })

  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw new AppError(401, ERROR_CODES.AUTH_REFRESH_INVALID, 'Refresh token expired or revoked')
  }

  await prisma.refreshToken.delete({ where: { token: refreshToken } })

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) {
    throw new AppError(404, ERROR_CODES.USER_NOT_FOUND, 'User not found')
  }

  const nextPayload = buildPayload(user)
  const accessToken = generateAccessToken(nextPayload)
  const nextRefreshToken = generateRefreshToken(nextPayload)
  await persistRefreshToken(user.id, nextRefreshToken)

  return {
    user: toUser(user),
    tokens: { accessToken, refreshToken: nextRefreshToken }
  }
}

export const logout = async (refreshToken?: string) => {
  if (!refreshToken) return
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
}
