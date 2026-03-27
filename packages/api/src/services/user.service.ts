import { ERROR_CODES } from '@clinikchat/shared'
import type { TokenPayload } from '@clinikchat/shared'

import { AppError } from '../lib/errors.js'
import { prisma } from '../lib/prisma.js'

const normalizeStatus = (status: 'ONLINE' | 'AWAY' | 'OFFLINE') => status.toLowerCase() as 'online' | 'away' | 'offline'

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
  status: normalizeStatus(user.status),
  lastSeenAt: user.lastSeenAt?.toISOString() ?? null,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString()
})

export const getCurrentUser = async (payload: TokenPayload) => {
  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) {
    throw new AppError(404, ERROR_CODES.USER_NOT_FOUND, 'User not found')
  }
  return toUser(user)
}

export const updateCurrentUser = async (
  payload: TokenPayload,
  input: { displayName?: string; avatarUrl?: string | null; status?: 'online' | 'away' | 'offline' }
) => {
  const data = {
    ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
    ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
    ...(input.status !== undefined
      ? { status: input.status.toUpperCase() as 'ONLINE' | 'AWAY' | 'OFFLINE' }
      : {})
  }

  const user = await prisma.user.update({
    where: { id: payload.sub },
    data
  })

  return toUser(user)
}
