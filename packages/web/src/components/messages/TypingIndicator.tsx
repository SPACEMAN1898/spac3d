import { useState, useEffect } from 'react'
import { SOCKET_EVENTS } from '@clinikchat/shared'
import { getSocket } from '../../lib/socket'
import { useAuthStore } from '../../stores/authStore'

interface TypingIndicatorProps {
  channelId: string
}

interface TypingUser {
  userId: string
  displayName?: string | undefined
}

export function TypingIndicator({ channelId }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const currentUserId = useAuthStore((s) => s.user?.id)

  useEffect(() => {
    let socket: ReturnType<typeof getSocket> | null = null
    try {
      socket = getSocket()
    } catch {
      return
    }

    const handleTypingStart = (data: { userId: string; channelId: string; displayName?: string }) => {
      if (data.channelId !== channelId || data.userId === currentUserId) return
      setTypingUsers((prev) => {
        if (prev.some((u) => u.userId === data.userId)) return prev
        const newUser: TypingUser = { userId: data.userId, displayName: data.displayName ?? undefined }
        return [...prev, newUser]
      })
    }

    const handleTypingStop = (data: { userId: string; channelId: string }) => {
      if (data.channelId !== channelId) return
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId))
    }

    socket.on(SOCKET_EVENTS.TYPING_START, handleTypingStart)
    socket.on(SOCKET_EVENTS.TYPING_STOP, handleTypingStop)

    return () => {
      socket?.off(SOCKET_EVENTS.TYPING_START, handleTypingStart)
      socket?.off(SOCKET_EVENTS.TYPING_STOP, handleTypingStop)
    }
  }, [channelId, currentUserId])

  if (typingUsers.length === 0) return <div className="h-6" />

  const names = typingUsers.map((u) => u.displayName ?? 'Someone')
  let text: string
  if (names.length === 1) {
    text = `${names[0]} is typing...`
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing...`
  } else {
    text = `${names[0]} and ${names.length - 1} others are typing...`
  }

  return (
    <div className="h-6 px-4 flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500 italic">{text}</span>
    </div>
  )
}
