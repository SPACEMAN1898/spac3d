import { SOCKET_EVENTS } from '@clinikchat/shared'
import { useState } from 'react'

import { api } from '../lib/api'
import { getSocket } from '../lib/socket'

interface MessageInputProps {
  channelId: string
}

export function MessageInput({ channelId }: MessageInputProps) {
  const [value, setValue] = useState('')

  return (
    <form
      className="border-t border-gray-200 bg-white p-4"
      onSubmit={async (event) => {
        event.preventDefault()
        const content = value.trim()
        if (!content) return

        await api.post(`/api/v1/channels/${channelId}/messages`, { content, type: 'text' })
        getSocket()?.emit(SOCKET_EVENTS.TYPING_STOP, { channelId })
        setValue('')
      }}
    >
      <textarea
        value={value}
        rows={3}
        placeholder="Type a message"
        onChange={(event) => {
          setValue(event.target.value)
          getSocket()?.emit(SOCKET_EVENTS.TYPING_START, { channelId })
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            event.currentTarget.form?.requestSubmit()
          }
        }}
        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
      />
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-gray-500">Enter to send, Shift+Enter for newline</p>
        <button type="submit" className="rounded bg-brand px-4 py-2 text-sm font-medium text-white">
          Send
        </button>
      </div>
    </form>
  )
}
