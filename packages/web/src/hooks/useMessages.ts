import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import apiClient from '../lib/api'
import type { Message, PaginatedResponse } from '@clinikchat/shared'
import { SOCKET_EVENTS } from '@clinikchat/shared'
import { getSocket } from '../lib/socket'
import { useAuthStore } from '../stores/authStore'

export function useMessages(channelId: string | null) {
  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const query = useInfiniteQuery({
    queryKey: ['messages', channelId],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const params = new URLSearchParams({ limit: '50' })
      if (pageParam) params.set('cursor', pageParam)
      const res = await apiClient.get<PaginatedResponse<Message>>(
        `/channels/${channelId}/messages?${params.toString()}`,
      )
      return res.data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor ?? undefined,
    enabled: !!channelId && isAuthenticated,
  })

  useEffect(() => {
    if (!channelId || !isAuthenticated) return

    let socket: ReturnType<typeof getSocket> | null = null
    try {
      socket = getSocket()
    } catch {
      return
    }

    const handleNewMessage = (message: Message) => {
      if (message.channelId !== channelId) return
      queryClient.setQueryData<typeof query.data>(['messages', channelId], (old) => {
        if (!old) return old
        const firstPage = old.pages[0]
        if (!firstPage) return old
        return {
          ...old,
          pages: [
            {
              ...firstPage,
              data: [...firstPage.data, message],
            },
            ...old.pages.slice(1),
          ],
        }
      })
    }

    const handleEditMessage = (updated: Message) => {
      if (updated.channelId !== channelId) return
      queryClient.setQueryData<typeof query.data>(['messages', channelId], (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((m) => (m.id === updated.id ? updated : m)),
          })),
        }
      })
    }

    const handleDeleteMessage = (data: { messageId: string }) => {
      queryClient.setQueryData<typeof query.data>(['messages', channelId], (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.filter((m) => m.id !== data.messageId),
          })),
        }
      })
    }

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage)
    socket.on(SOCKET_EVENTS.MESSAGE_EDIT, handleEditMessage)
    socket.on(SOCKET_EVENTS.MESSAGE_DELETE, handleDeleteMessage)

    return () => {
      socket?.off(SOCKET_EVENTS.MESSAGE_NEW, handleNewMessage)
      socket?.off(SOCKET_EVENTS.MESSAGE_EDIT, handleEditMessage)
      socket?.off(SOCKET_EVENTS.MESSAGE_DELETE, handleDeleteMessage)
    }
  }, [channelId, isAuthenticated, queryClient])

  const allMessages = query.data?.pages.flatMap((page) => page.data) ?? []

  return { ...query, allMessages }
}
