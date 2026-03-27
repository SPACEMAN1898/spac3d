import { ERROR_CODES, type AuthResponse, type LoginSchema, type RegisterSchema } from '@clinikchat/shared'
import { MemberRole, UserStatus } from '@prisma/client'

import { AppError } from '../lib/errors'
import { generateAccessToken, generateRefreshToken, verifyToken } from '../lib/jwt'
import { comparePassword, hashPassword } from '../lib/password'
import { prisma } from '../lib/prisma'

function toAuthUser(user: {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  status: UserStatus
  lastSeenAt: Date | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    status: user.status.toLowerCase() as 'online' | 'away' | 'offline',
    lastSeenAt: user.lastSeenAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  }
}

function buildSlug(displayName: string): string {
  const base = displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${base || 'workspace'}-${Math.random().toString(36).slice(2, 8)}`
}

function getRefreshExpiryDate(): Date {
  const value = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d'
  const days = /^(\d+)d$/.exec(value)
  if (days) return new Date(Date.now() + Number(days[1]) * 24 * 60 * 60 * 1000)
  const hours = /^(\d+)h$/.exec(value)
  if (hours) return new Date(Date.now() + Number(hours[1]) * 60 * 60 * 1000)
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
}

async function issueTokens(user: { id: string; email: string }) {
  const tokenPayload = { sub: user.id, email: user.email }
  const accessToken = generateAccessToken(tokenPayload)
  const refreshToken = generateRefreshToken(tokenPayload)

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: getRefreshExpiryDate()
    }
  })

  return { accessToken, refreshToken }
}

export async function register(input: RegisterSchema): Promise<AuthResponse & { refreshToken: string }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw new AppError('User already exists', 409, ERROR_CODES.USER_ALREADY_EXISTS)
  }

  const passwordHash = await hashPassword(input.password)

  const user = await prisma.user.create({
    data: {
      email: input.email,
      displayName: input.displayName,
      passwordHash
    }
  })

  const org = await prisma.organization.create({
    data: {
      name: `${input.displayName}'s Organization`,
      slug: buildSlug(input.displayName),
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: MemberRole.OWNER
        }
      }
    }
  })

  await prisma.channel.create({
    data: {
      orgId: org.id,
      name: 'general',
      type: 'PUBLIC',
      createdById: user.id,
      members: {
        create: {
          userId: user.id,
          role: MemberRole.OWNER
        }
      }
    }
  })

  const tokens = await issueTokens({ id: user.id, email: user.email })
  return {
    user: toAuthUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  }
}

export async function login(input: LoginSchema): Promise<AuthResponse & { refreshToken: string }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user) {
    throw new AppError('Invalid credentials', 401, ERROR_CODES.AUTH_INVALID_CREDENTIALS)
  }

  const valid = await comparePassword(input.password, user.passwordHash)
  if (!valid) {
    throw new AppError('Invalid credentials', 401, ERROR_CODES.AUTH_INVALID_CREDENTIALS)
  }

  const tokens = await issueTokens({ id: user.id, email: user.email })

  await prisma.user.update({
    where: { id: user.id },
    data: {
      status: UserStatus.ONLINE,
      lastSeenAt: new Date()
    }
  })

  return {
    user: toAuthUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  }
}

export async function refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const dbToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
  if (!dbToken || dbToken.expiresAt < new Date()) {
    throw new AppError('Refresh token is invalid', 401, ERROR_CODES.AUTH_TOKEN_INVALID)
  }

  const payload = verifyToken(refreshToken, 'refresh')
  await prisma.refreshToken.delete({ where: { token: refreshToken } })

  const tokens = await issueTokens({ id: payload.sub, email: payload.email })
  return tokens
}

export async function logout(refreshToken: string): Promise<void> {
  if (!refreshToken) return
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
}
