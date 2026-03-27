import { useParams, Navigate } from 'react-router-dom'
import { useMessages } from '../hooks/useMessages'
import { MessageList } from '../components/messages/MessageList'
import { MessageInput } from '../components/messages/MessageInput'
import { TypingIndicator } from '../components/messages/TypingIndicator'
import apiClient from '../lib/api'
import type { Channel, ApiResponse } from '@clinikchat/shared'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

export function ChannelView() {
  const { channelId } = useParams<{ channelId: string }>()

  const { data: channel } = useQuery({
    queryKey: ['channel', channelId],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Channel>>(`/channels/${channelId}`)
      return res.data.data
    },
    enabled: !!channelId,
  })

  const { allMessages, hasNextPage, fetchNextPage, isFetchingNextPage } = useMessages(
    channelId ?? null,
  )

  // Mark channel as read when viewed
  useEffect(() => {
    if (!channelId) return
    const timer = setTimeout(() => {
      apiClient.post(`/channels/${channelId}/read`).catch(() => null)
    }, 1000)
    return () => clearTimeout(timer)
  }, [channelId])

  if (!channelId) return <Navigate to="/app" replace />

  return (
    <div className="flex flex-col h-full">
      {/* Channel header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
        <div>
          <h1 className="font-semibold text-gray-900 text-sm">
            {channel?.type === 'DM' ? channel.name : `#${channel?.name ?? channelId}`}
          </h1>
          {channel?.topic && (
            <p className="text-xs text-gray-500 truncate max-w-lg">{channel.topic}</p>
          )}
        </div>
      </header>

      {/* Messages */}
      <MessageList
        messages={allMessages}
        hasMore={hasNextPage ?? false}
        onLoadMore={() => { void fetchNextPage() }}
        isLoadingMore={isFetchingNextPage}
        channelId={channelId}
      />

      {/* Typing indicator */}
      <TypingIndicator channelId={channelId} />

      {/* Message input */}
      <MessageInput
        channelId={channelId}
        channelName={channel?.name ?? channelId}
      />
    </div>
  )
}
