import { useQuery } from '@tanstack/react-query'
import { API_ROUTES } from '@clinikchat/shared'
import { Link, useParams } from 'react-router-dom'

import { api } from '../lib/api'

interface Organization {
  id: string
  name: string
  slug: string
}

interface Channel {
  id: string
  name: string
  type: 'public' | 'private' | 'dm'
  unreadCount?: number
}

export function Sidebar() {
  const { orgSlug, channelId } = useParams<{ orgSlug: string; channelId: string }>()

  const orgsQuery = useQuery({
    queryKey: ['orgs'],
    queryFn: async () => {
      const response = await api.get(API_ROUTES.orgs.base)
      return (response.data.data ?? []) as Organization[]
    }
  })

  const activeOrg = orgsQuery.data?.find((org) => org.slug === orgSlug) ?? orgsQuery.data?.[0]

  const channelsQuery = useQuery({
    queryKey: ['channels', activeOrg?.id],
    enabled: Boolean(activeOrg?.id),
    queryFn: async () => {
      const response = await api.get(`${API_ROUTES.orgs.base}/${activeOrg!.id}/channels`)
      return (response.data.data ?? []) as Channel[]
    }
  })

  const publicChannels = (channelsQuery.data ?? []).filter((channel) => channel.type !== 'dm')
  const dmChannels = (channelsQuery.data ?? []).filter((channel) => channel.type === 'dm')

  return (
    <aside className="flex h-full w-72 flex-col bg-sidebar text-gray-100">
      <div className="border-b border-white/10 p-4">
        <p className="text-xs uppercase tracking-wide text-gray-400">Organization</p>
        <p className="mt-1 truncate text-sm font-semibold">{activeOrg?.name ?? 'Loading...'}</p>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Channels</h2>
          <ul className="space-y-1">
            {publicChannels.map((channel) => {
              const active = channel.id === channelId
              return (
                <li key={channel.id}>
                  <Link
                    to={`/app/${activeOrg?.slug ?? orgSlug}/${channel.id}`}
                    className={`flex items-center justify-between rounded px-2 py-1.5 text-sm ${
                      active ? 'bg-sidebarMuted text-white' : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="truncate"># {channel.name}</span>
                    {channel.unreadCount ? (
                      <span className="rounded-full bg-brand px-2 py-0.5 text-xs text-white">
                        {channel.unreadCount}
                      </span>
                    ) : null}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Direct messages</h2>
          <ul className="space-y-1">
            {dmChannels.map((channel) => (
              <li key={channel.id}>
                <Link
                  to={`/app/${activeOrg?.slug ?? orgSlug}/${channel.id}`}
                  className="flex items-center justify-between rounded px-2 py-1.5 text-sm text-gray-300 hover:bg-white/5"
                >
                  <span className="truncate">{channel.name}</span>
                  {channel.unreadCount ? (
                    <span className="rounded-full bg-brand px-2 py-0.5 text-xs text-white">
                      {channel.unreadCount}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </aside>
  )
}
