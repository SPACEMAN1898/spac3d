import { prisma } from '../lib/prisma'
import { hashPassword, comparePassword } from '../lib/password'
import { generateAccessToken, generateRefreshToken, getRefreshTokenExpiry, verifyRefreshToken } from '../lib/jwt'
import { AppError } from '../lib/errors'
import { ERROR_CODES } from '@clinikchat/shared'
import type { RegisterInput, LoginInput } from '@clinikchat/shared'
import type { User } from '@prisma/client'
import crypto from 'crypto'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

function formatUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    status: user.status,
    lastSeenAt: user.lastSeenAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw new AppError(409, ERROR_CODES.AUTH_EMAIL_TAKEN, 'Email is already in use')
  }

  const passwordHash = await hashPassword(input.password)
  const slug = input.displayName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') +
    '-' + crypto.randomBytes(3).toString('hex')

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: input.email,
        displayName: input.displayName,
        passwordHash,
      },
    })

    // Create a default personal org
    const org = await tx.organization.create({
      data: {
        name: `${input.displayName}'s Workspace`,
        slug,
        ownerId: newUser.id,
      },
    })

    // Add creator as OWNER
    await tx.organizationMember.create({
      data: {
        orgId: org.id,
        userId: newUser.id,
        role: 'OWNER',
      },
    })

    // Create a default #general channel
    const channel = await tx.channel.create({
      data: {
        orgId: org.id,
        name: 'general',
        topic: 'General discussion',
        type: 'PUBLIC',
        createdById: newUser.id,
      },
    })

    await tx.channelMember.create({
      data: {
        channelId: channel.id,
        userId: newUser.id,
        role: 'OWNER',
      },
    })

    return newUser
  })

  const tokens = await generateTokens(user.id, user.email)
  return { user: formatUser(user), ...tokens }
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user) {
    throw new AppError(401, ERROR_CODES.AUTH_INVALID_CREDENTIALS, 'Invalid email or password')
  }

  const valid = await comparePassword(input.password, user.passwordHash)
  if (!valid) {
    throw new AppError(401, ERROR_CODES.AUTH_INVALID_CREDENTIALS, 'Invalid email or password')
  }

  await prisma.user.update({ where: { id: user.id }, data: { status: 'ONLINE' } })

  const tokens = await generateTokens(user.id, user.email)
  return { user: formatUser({ ...user, status: 'ONLINE' }), ...tokens }
}

export async function refreshTokens(refreshToken: string) {
  let payload: { sub: string }
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw new AppError(401, ERROR_CODES.AUTH_REFRESH_TOKEN_INVALID, 'Invalid refresh token')
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError(401, ERROR_CODES.AUTH_REFRESH_TOKEN_INVALID, 'Refresh token expired or revoked')
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) {
    throw new AppError(401, ERROR_CODES.AUTH_REFRESH_TOKEN_INVALID, 'User not found')
  }

  // Rotate refresh token
  await prisma.refreshToken.delete({ where: { token: refreshToken } })
  const tokens = await generateTokens(user.id, user.email)
  return tokens
}

export async function logoutUser(refreshToken: string) {
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => null)
  }
}

async function generateTokens(userId: string, email: string): Promise<AuthTokens> {
  const accessToken = generateAccessToken({ sub: userId, email })
  const refreshTokenValue = generateRefreshToken(userId)

  await prisma.refreshToken.create({
    data: {
      userId,
      token: refreshTokenValue,
      expiresAt: getRefreshTokenExpiry(),
    },
  })

  return { accessToken, refreshToken: refreshTokenValue }
}
