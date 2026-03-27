import { SOCKET_EVENTS } from '@clinikchat/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import { api } from '../../lib/api'
import { getSocket } from '../../lib/socket'

interface MessageInputProps {
  channelId: string
}

export const MessageInput = ({ channelId }: MessageInputProps) => {
  const queryClient = useQueryClient()
  const [value, setValue] = useState('')
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({})

  const typingLabel = useMemo(() => {
    const names = Object.values(typingUsers)
    if (names.length === 0) return null
    if (names.length === 1) return `${names[0]} is typing...`
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`
    return `${names[0]}, ${names[1]}, and others are typing...`
  }, [typingUsers])

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post(`/api/v1/channels/${channelId}/messages`, { content: value })
    },
    onSuccess: async () => {
      setValue('')
      await queryClient.invalidateQueries({ queryKey: ['messages', channelId] })
    }
  })

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleTypingStart = (payload: { channelId: string; userId: string; displayName: string }) => {
      if (payload.channelId !== channelId) return
      setTypingUsers((current) => ({ ...current, [payload.userId]: payload.displayName }))
    }

    const handleTypingStop = (payload: { channelId: string; userId: string }) => {
      if (payload.channelId !== channelId) return
      setTypingUsers((current) => {
        const next = { ...current }
        delete next[payload.userId]
        return next
      })
    }

    socket.on(SOCKET_EVENTS.TYPING_START, handleTypingStart)
    socket.on(SOCKET_EVENTS.TYPING_STOP, handleTypingStop)

    return () => {
      socket.off(SOCKET_EVENTS.TYPING_START, handleTypingStart)
      socket.off(SOCKET_EVENTS.TYPING_STOP, handleTypingStop)
    }
  }, [channelId])

  const emitTyping = () => {
    getSocket()?.emit(SOCKET_EVENTS.TYPING_START, { channelId })
  }

  const handleSubmit = async () => {
    if (!value.trim() || mutation.isPending) return
    await mutation.mutateAsync()
    getSocket()?.emit(SOCKET_EVENTS.TYPING_STOP, { channelId })
  }

  return (
    <div className="border-t border-slate-200 bg-white px-6 py-4">
      <div className="mb-2 min-h-5 text-sm text-slate-500">{typingLabel}</div>
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
        <textarea
          value={value}
          rows={3}
          placeholder="Message this channel"
          className="w-full resize-none border-0 bg-transparent text-sm text-slate-800 outline-none"
          onChange={(event) => {
            setValue(event.target.value)
            emitTyping()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void handleSubmit()
            }
          }}
        />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-slate-400">Enter to send, Shift+Enter for newline</p>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={mutation.isPending || !value.trim()}
            className="rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
