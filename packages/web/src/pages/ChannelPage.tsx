import { SOCKET_EVENTS } from '@clinikchat/shared'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import { MessageInput } from '../components/MessageInput'
import { MessageList } from '../components/MessageList'
import { getSocket } from '../lib/socket'

export function ChannelPage() {
  const { channelId } = useParams<{ channelId: string }>()
  const [typingUsers, setTypingUsers] = useState<string[]>([])

  useEffect(() => {
    const socket = getSocket()
    if (!socket || !channelId) return

    const handleTypingStart = (payload: { channelId: string; userId: string }) => {
      if (payload.channelId !== channelId) return
      setTypingUsers((current) => Array.from(new Set([...current, payload.userId])))
    }

    const handleTypingStop = (payload: { channelId: string; userId: string }) => {
      if (payload.channelId !== channelId) return
      setTypingUsers((current) => current.filter((userId) => userId !== payload.userId))
    }

    socket.on(SOCKET_EVENTS.TYPING_START, handleTypingStart)
    socket.on(SOCKET_EVENTS.TYPING_STOP, handleTypingStop)

    return () => {
      socket.off(SOCKET_EVENTS.TYPING_START, handleTypingStart)
      socket.off(SOCKET_EVENTS.TYPING_STOP, handleTypingStop)
    }
  }, [channelId])

  const typingLabel = useMemo(() => {
    if (typingUsers.length === 0) return null
    if (typingUsers.length === 1) return 'Someone is typing...'
    return `${typingUsers.length} people are typing...`
  }, [typingUsers])

  if (!channelId) {
    return <div className="grid h-full place-content-center text-gray-500">Select a channel</div>
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 bg-white px-6 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Channel</h2>
        {typingLabel ? <p className="text-xs text-gray-500">{typingLabel}</p> : null}
      </div>

      <div className="min-h-0 flex-1">
        <MessageList channelId={channelId} />
      </div>

      <MessageInput channelId={channelId} />
    </div>
  )
}
