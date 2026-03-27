import { ERROR_CODES } from '@clinikchat/shared'
import { z } from 'zod'

import { AppError } from '../lib/errors'
import { prisma } from '../lib/prisma'

export const updateMeSchema = z.object({
  displayName: z.string().min(2).max(80).optional(),
  avatarUrl: z.string().url().nullable().optional()
})

function normalizeStatus(status: 'ONLINE' | 'AWAY' | 'OFFLINE') {
  return status.toLowerCase() as 'online' | 'away' | 'offline'
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new AppError('User not found', 404, ERROR_CODES.USER_NOT_FOUND)
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    status: normalizeStatus(user.status),
    lastSeenAt: user.lastSeenAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  }
}

export async function updateMe(userId: string, input: z.infer<typeof updateMeSchema>) {
  const data: {
    displayName?: string
    avatarUrl?: string | null
  } = {}

  if (input.displayName !== undefined) {
    data.displayName = input.displayName
  }
  if (input.avatarUrl !== undefined) {
    data.avatarUrl = input.avatarUrl
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data
  })

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    status: normalizeStatus(user.status),
    lastSeenAt: user.lastSeenAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  }
}
