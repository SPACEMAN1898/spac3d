import type { Message } from '@clinikchat/shared'
import { formatDate } from '@clinikchat/shared'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useMemo, useRef } from 'react'

interface MessageListProps {
  messages: Message[]
}

type MessageRow =
  | { kind: 'separator'; id: string; label: string }
  | { kind: 'message'; id: string; message: Message; compact: boolean }

export const MessageList = ({ messages }: MessageListProps) => {
  const parentRef = useRef<HTMLDivElement>(null)

  const rows = useMemo<MessageRow[]>(() => {
    const nextRows: MessageRow[] = []

    messages.forEach((message, index) => {
      const previous = messages[index - 1]
      const messageDate = new Date(message.createdAt).toDateString()
      const previousDate = previous ? new Date(previous.createdAt).toDateString() : null

      if (messageDate !== previousDate) {
        nextRows.push({
          kind: 'separator',
          id: `separator-${messageDate}`,
          label: formatDate(message.createdAt, { dateStyle: 'full' })
        })
      }

      const compact =
        previous?.userId === message.userId &&
        new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime() < 5 * 60 * 1000

      nextRows.push({
        kind: 'message',
        id: message.id,
        message,
        compact
      })
    })

    return nextRows
  }, [messages])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (rows[index]?.kind === 'separator' ? 48 : 88),
    overscan: 8
  })

  return (
    <div ref={parentRef} className="h-full overflow-y-auto px-6 py-6">
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const row = rows[virtualItem.index]
          if (!row) return null

          return (
            <div
              key={row.id}
              className="absolute left-0 top-0 w-full"
              style={{ transform: `translateY(${virtualItem.start}px)` }}
            >
              {row.kind === 'separator' ? (
                <div className="my-3 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span>{row.label}</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
              ) : (
                <article className={`rounded-3xl px-4 py-3 transition hover:bg-slate-100 ${row.compact ? 'mt-1' : 'mt-4'}`}>
                  {!row.compact ? (
                    <div className="mb-1 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-semibold text-cyan-700">
                        {row.message.user?.displayName?.slice(0, 1).toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{row.message.user?.displayName ?? 'Unknown user'}</div>
                        <div className="text-xs text-slate-500">{formatDate(row.message.createdAt)}</div>
                      </div>
                    </div>
                  ) : null}
                  <p className={`whitespace-pre-wrap text-sm leading-6 text-slate-700 ${row.compact ? 'pl-[3.25rem]' : ''}`}>
                    {row.message.content}
                    {row.message.editedAt ? <span className="ml-2 text-xs text-slate-400">(edited)</span> : null}
                  </p>
                </article>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
