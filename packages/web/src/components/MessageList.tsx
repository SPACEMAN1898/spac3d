import { formatDate, truncateText } from '@clinikchat/shared'
import { useQuery } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useMemo, useRef } from 'react'

import { api } from '../lib/api'

interface MessageListProps {
  channelId: string
}

interface MessageItem {
  id: string
  userId: string
  content: string
  createdAt: string
  editedAt?: string | null
  user?: {
    id: string
    displayName: string
    avatarUrl?: string | null
  }
}

interface MessageListResponse {
  items: MessageItem[]
  nextCursor?: string | null
  prevCursor?: string | null
  hasMore: boolean
}

type RenderItem =
  | { type: 'separator'; id: string; label: string }
  | { type: 'message'; id: string; message: MessageItem; grouped: boolean }

function toDateLabel(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value))
}

export function MessageList({ channelId }: MessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const messagesQuery = useQuery({
    queryKey: ['messages', channelId],
    queryFn: async () => {
      const response = await api.get(`/api/v1/channels/${channelId}/messages`)
      return response.data.data as MessageListResponse
    }
  })

  const renderItems = useMemo<RenderItem[]>(() => {
    const source = messagesQuery.data?.items ?? []
    const items: RenderItem[] = []
    let previousDate = ''

    source.forEach((message, index) => {
      const currentDate = new Date(message.createdAt).toDateString()
      if (currentDate !== previousDate) {
        items.push({
          type: 'separator',
          id: `sep-${currentDate}`,
          label: toDateLabel(message.createdAt)
        })
        previousDate = currentDate
      }

      const previousMessage = source[index - 1]
      const grouped =
        previousMessage != null &&
        previousMessage.userId === message.userId &&
        Math.abs(new Date(message.createdAt).getTime() - new Date(previousMessage.createdAt).getTime()) <
          3 * 60 * 1000

      items.push({
        type: 'message',
        id: message.id,
        message,
        grouped
      })
    })

    return items
  }, [messagesQuery.data])

  const virtualizer = useVirtualizer({
    count: renderItems.length,
    estimateSize: (index) => (renderItems[index]?.type === 'separator' ? 36 : 74),
    getScrollElement: () => parentRef.current,
    overscan: 8
  })

  return (
    <div ref={parentRef} className="h-full overflow-y-auto px-4 py-3">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((row) => {
          const item = renderItems[row.index]
          if (!item) return null

          return (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${row.start}px)`
              }}
            >
              {item.type === 'separator' ? (
                <div className="my-2 flex items-center">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="px-2 text-xs font-medium text-gray-400">{item.label}</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
              ) : (
                <article className={`rounded-md px-2 py-2 hover:bg-gray-100 ${item.grouped ? 'ml-10' : ''}`}>
                  {!item.grouped ? (
                    <header className="mb-1 flex items-center gap-2">
                      <div className="grid h-8 w-8 place-content-center rounded-full bg-gray-300 text-xs font-semibold text-gray-700">
                        {(item.message.user?.displayName ?? '?').slice(0, 1).toUpperCase()}
                      </div>
                      <p className="text-sm font-semibold text-gray-800">
                        {item.message.user?.displayName ?? 'Unknown'}
                      </p>
                      <time className="text-xs text-gray-500">{formatDate(item.message.createdAt)}</time>
                    </header>
                  ) : null}
                  <p className="whitespace-pre-wrap text-sm text-gray-700">{truncateText(item.message.content, 4000)}</p>
                  {item.message.editedAt ? <p className="mt-1 text-xs text-gray-400">edited</p> : null}
                </article>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
