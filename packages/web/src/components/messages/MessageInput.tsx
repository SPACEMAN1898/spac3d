import { useState, useRef, useCallback } from 'react'
import { SOCKET_EVENTS } from '@clinikchat/shared'
import { getSocket } from '../../lib/socket'
import { useAuthStore } from '../../stores/authStore'

interface MessageInputProps {
  channelId: string
  channelName: string
}

export function MessageInput({ channelId, channelName }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const sendTypingStart = useCallback(() => {
    if (!isAuthenticated) return
    try {
      const socket = getSocket()
      if (!isTypingRef.current) {
        socket.emit(SOCKET_EVENTS.TYPING_START, { channelId })
        isTypingRef.current = true
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit(SOCKET_EVENTS.TYPING_STOP, { channelId })
        isTypingRef.current = false
      }, 3000)
    } catch {
      // Socket not connected
    }
  }, [channelId, isAuthenticated])

  const sendTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    if (isTypingRef.current) {
      try {
        const socket = getSocket()
        socket.emit(SOCKET_EVENTS.TYPING_STOP, { channelId })
      } catch {
        // Socket not connected
      }
      isTypingRef.current = false
    }
  }, [channelId])

  const handleSend = useCallback(() => {
    const trimmed = content.trim()
    if (!trimmed || isSending) return

    setIsSending(true)
    sendTypingStop()

    try {
      const socket = getSocket()
      socket.emit(
        SOCKET_EVENTS.MESSAGE_NEW,
        { channelId, content: trimmed },
        () => {
          setIsSending(false)
        },
      )
      setContent('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch {
      setIsSending(false)
    }
  }, [content, isSending, channelId, sendTypingStop])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    sendTypingStart()

    // Auto-resize textarea
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  return (
    <div className="px-4 pb-4 pt-2 border-t border-gray-100">
      <div className="flex items-end gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-colors">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${channelName}`}
          rows={1}
          className="flex-1 resize-none text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none bg-transparent max-h-48 overflow-y-auto"
          disabled={isSending}
        />
        <button
          onClick={handleSend}
          disabled={!content.trim() || isSending}
          className="flex-shrink-0 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-md p-1.5 transition-colors"
          title="Send message (Enter)"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1 px-1">
        Press <kbd className="bg-gray-100 px-1 rounded">Enter</kbd> to send,{' '}
        <kbd className="bg-gray-100 px-1 rounded">Shift+Enter</kbd> for newline
      </p>
    </div>
  )
}
