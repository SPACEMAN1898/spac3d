import { Link, useNavigate, useParams } from 'react-router-dom'
import { clsx } from 'clsx'
import { useAuthStore } from '../../stores/authStore'
import { useOrgs } from '../../hooks/useOrgs'
import { useChannels } from '../../hooks/useChannels'
import { Avatar } from '../ui/Avatar'
import apiClient from '../../lib/api'
import type { Channel } from '@clinikchat/shared'

export function Sidebar() {
  const { orgSlug, channelId } = useParams<{ orgSlug: string; channelId: string }>()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const { data: orgs } = useOrgs()
  const activeOrg = orgs?.find((o) => o.slug === orgSlug) ?? orgs?.[0]

  const { data: channels } = useChannels(activeOrg?.id ?? null)

  const publicChannels = channels?.filter((c) => c.type !== 'DM') ?? []
  const dmChannels = channels?.filter((c) => c.type === 'DM') ?? []

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // ignore
    }
    logout()
    navigate('/login')
  }

  function ChannelItem({ channel }: { channel: Channel }) {
    const isActive = channel.id === channelId
    const hasUnread = (channel.unreadCount ?? 0) > 0

    return (
      <Link
        to={`/app/${activeOrg?.slug ?? ''}/${channel.id}`}
        className={clsx(
          'flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-colors group',
          isActive
            ? 'bg-sidebar-active text-white'
            : 'text-sidebar-text hover:bg-sidebar-hover',
        )}
      >
        <span className="text-sidebar-muted group-hover:text-sidebar-text">#</span>
        <span className={clsx('flex-1 truncate', hasUnread && !isActive && 'font-semibold text-white')}>
          {channel.name}
        </span>
        {hasUnread && !isActive && (
          <span className="bg-brand-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
            {(channel.unreadCount ?? 0) > 99 ? '99+' : channel.unreadCount}
          </span>
        )}
      </Link>
    )
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-sidebar-bg flex flex-col h-full">
      {/* Workspace header */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold truncate text-sm">
            {activeOrg?.name ?? 'ClinikChat'}
          </h2>
          <button className="text-sidebar-muted hover:text-white transition-colors text-lg leading-none">
            ✕
          </button>
        </div>
        {orgs && orgs.length > 1 && (
          <div className="mt-2 flex gap-1 flex-wrap">
            {orgs.map((org) => (
              <Link
                key={org.id}
                to={`/app/${org.slug}/${channels?.[0]?.id ?? ''}`}
                className={clsx(
                  'text-xs px-2 py-0.5 rounded',
                  org.id === activeOrg?.id
                    ? 'bg-sidebar-active text-white'
                    : 'text-sidebar-muted hover:text-white',
                )}
              >
                {org.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Channel list */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2">
        {publicChannels.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center px-3 mb-1">
              <span className="text-xs font-semibold text-sidebar-muted uppercase tracking-wider flex-1">
                Channels
              </span>
            </div>
            {publicChannels.map((channel) => (
              <ChannelItem key={channel.id} channel={channel} />
            ))}
          </div>
        )}

        {dmChannels.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center px-3 mb-1">
              <span className="text-xs font-semibold text-sidebar-muted uppercase tracking-wider flex-1">
                Direct Messages
              </span>
            </div>
            {dmChannels.map((channel) => (
              <ChannelItem key={channel.id} channel={channel} />
            ))}
          </div>
        )}
      </nav>

      {/* User status bar */}
      {user && (
        <div className="px-3 py-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2">
            <Avatar
              src={user.avatarUrl}
              name={user.displayName}
              size="sm"
              status={user.status}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
              <p className="text-xs text-sidebar-muted truncate">{user.status.toLowerCase()}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sidebar-muted hover:text-white transition-colors text-xs"
              title="Sign out"
            >
              ⏻
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
