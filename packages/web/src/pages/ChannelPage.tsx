import { useQuery } from '@tanstack/react-query'

import { MessageInput } from '../components/messages/MessageInput'
import { MessageList } from '../components/messages/MessageList'

import { fetchMessages, useAppShell } from './AppShellPage'

export const ChannelPage = () => {
  const { currentChannel } = useAppShell()

  const messagesQuery = useQuery({
    queryKey: ['messages', currentChannel?.id],
    queryFn: () => fetchMessages(currentChannel!.id),
    enabled: Boolean(currentChannel?.id)
  })

  if (!currentChannel) {
    return <div className="grid h-screen place-items-center">Choose a channel</div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-5">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{currentChannel.type}</div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{currentChannel.name}</h1>
        <p className="mt-1 text-sm text-slate-500">{currentChannel.topic ?? 'Secure team conversations, all in one place.'}</p>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">
        <MessageList messages={messagesQuery.data ?? []} />
      </div>
      <MessageInput channelId={currentChannel.id} />
    </div>
  )
}
