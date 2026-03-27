import type { Channel, Organization } from '@clinikchat/shared'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useAuthStore } from '../../store/auth'

interface SidebarProps {
  organizations: Organization[]
  channels: Channel[]
}

export const Sidebar = ({ organizations, channels }: SidebarProps) => {
  const { orgSlug, channelId } = useParams()
  const user = useAuthStore((state) => state.user)

  const publicChannels = channels.filter((channel) => channel.type !== 'dm')
  const directMessages = channels.filter((channel) => channel.type === 'dm')

  return (
    <aside className="flex h-screen w-full max-w-sm flex-col border-r border-slate-800 bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 px-5 py-4">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Organizations</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {organizations.map((organization) => (
            <Link
              key={organization.id}
              to={`/app/${organization.slug}/${channels.find((channel) => channel.orgId === organization.id)?.id ?? ''}`}
              className={`rounded-2xl px-3 py-2 text-sm transition ${
                organization.slug === orgSlug ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {organization.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <SidebarSection title="Channels">
          {publicChannels.map((channel) => (
            <SidebarLink
              key={channel.id}
              {...(orgSlug ? { orgSlug } : {})}
              channel={channel}
              active={channel.id === channelId}
            />
          ))}
        </SidebarSection>

        <SidebarSection title="Direct messages">
          {directMessages.map((channel) => (
            <SidebarLink
              key={channel.id}
              {...(orgSlug ? { orgSlug } : {})}
              channel={channel}
              active={channel.id === channelId}
            />
          ))}
        </SidebarSection>
      </div>

      <div className="border-t border-slate-800 px-5 py-4">
        <div className="text-sm font-medium text-white">{user?.displayName ?? 'Guest'}</div>
        <div className="mt-1 text-xs text-slate-400">{user?.status ?? 'offline'}</div>
      </div>
    </aside>
  )
}

const SidebarSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="mb-8">
    <div className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-500">{title}</div>
    <div className="space-y-1">{children}</div>
  </section>
)

const SidebarLink = ({
  orgSlug,
  channel,
  active
}: {
  orgSlug?: string
  channel: Channel
  active: boolean
}) => (
  <Link
    to={`/app/${orgSlug ?? ''}/${channel.id}`}
    className={`flex items-center justify-between rounded-2xl px-3 py-2 text-sm transition ${
      active ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-900 hover:text-white'
    }`}
  >
    <span className="truncate">{channel.type === 'dm' ? channel.name : `# ${channel.name}`}</span>
    {channel.unreadCount ? (
      <span className="ml-3 rounded-full bg-cyan-500 px-2 py-0.5 text-xs font-semibold text-slate-950">{channel.unreadCount}</span>
    ) : null}
  </Link>
)
