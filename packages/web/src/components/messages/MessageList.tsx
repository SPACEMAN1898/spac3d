import { useRef, useEffect, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Message } from '@clinikchat/shared'
import { MessageItem } from './MessageItem'
import { isSameDay, formatDate } from '@clinikchat/shared'

interface MessageListProps {
  messages: Message[]
  hasMore: boolean
  onLoadMore: () => void
  isLoadingMore: boolean
  channelId: string
}

function DateSeparator({ date }: { date: string }) {
  const now = new Date()
  const msgDate = new Date(date)
  const isToday = isSameDay(now, msgDate)
  const isYesterday = isSameDay(new Date(now.getTime() - 86400000), msgDate)

  const label = isToday ? 'Today' : isYesterday ? 'Yesterday' : formatDate(date)

  return (
    <div className="flex items-center gap-3 py-2 px-4">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs font-semibold text-gray-500 px-2">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  )
}

type MessageListItem =
  | { type: 'date'; key: string; date: string }
  | { type: 'message'; key: string; message: Message; isGrouped: boolean }

export function MessageList({
  messages,
  hasMore,
  onLoadMore,
  isLoadingMore,
  channelId,
}: MessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  // Build flattened list with date separators and grouping
  const items: MessageListItem[] = []
  let lastDate: string | null = null
  let lastUserId: string | null = null
  let lastTimestamp: string | null = null

  for (const message of messages) {
    // Add date separator if needed
    if (!lastDate || !isSameDay(lastDate, message.createdAt)) {
      items.push({ type: 'date', key: `date-${message.id}`, date: message.createdAt })
      lastDate = message.createdAt
      lastUserId = null
    }

    // Group consecutive messages from same user within 5 minutes
    const isGrouped =
      lastUserId === message.userId &&
      lastTimestamp !== null &&
      new Date(message.createdAt).getTime() - new Date(lastTimestamp).getTime() < 5 * 60 * 1000

    items.push({ type: 'message', key: message.id, message, isGrouped })
    lastUserId = message.userId
    lastTimestamp = message.createdAt
  }

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = items[index]
      if (!item) return 40
      if (item.type === 'date') return 40
      return item.isGrouped ? 28 : 60
    },
    overscan: 10,
  })

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!isAtBottomRef.current) return
    virtualizer.scrollToIndex(items.length - 1, { behavior: 'smooth' })
  }, [messages.length])

  // Detect scroll position to trigger load-more
  const handleScroll = useCallback(() => {
    const el = parentRef.current
    if (!el) return

    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    isAtBottomRef.current = atBottom

    if (el.scrollTop < 100 && hasMore && !isLoadingMore) {
      onLoadMore()
    }
  }, [hasMore, isLoadingMore, onLoadMore])

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-y-auto scrollbar-thin"
      onScroll={handleScroll}
    >
      {hasMore && (
        <div className="flex justify-center py-3">
          {isLoadingMore ? (
            <span className="text-sm text-gray-400">Loading older messages...</span>
          ) : (
            <button
              onClick={onLoadMore}
              className="text-sm text-brand-600 hover:text-brand-700"
            >
              Load more messages
            </button>
          )}
        </div>
      )}

      <div
        style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index]
          if (!item) return null

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {item.type === 'date' ? (
                <DateSeparator date={item.date} />
              ) : (
                <MessageItem
                  message={item.message}
                  isGrouped={item.isGrouped}
                  channelId={channelId}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
