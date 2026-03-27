import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { usePresenceStore } from '../../stores/presenceStore';
import { useSocketStore, disconnectSocket } from '../../lib/socket';
import CreateChannelModal from '../channel/CreateChannelModal';

interface OrgData {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface ChannelData {
  id: string;
  name: string;
  type: string;
  topic: string | null;
  unreadCount?: number;
}

export default function Sidebar() {
  const navigate = useNavigate();
  const { orgSlug, channelId } = useParams();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const socketStatus = useSocketStore((s) => s.status);
  const getStatus = usePresenceStore((s) => s.getStatus);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('');

  const { data: orgs } = useQuery<OrgData[]>({
    queryKey: ['orgs'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/orgs');
      return data.data;
    },
  });

  const currentOrg = orgs?.find((o) => o.slug === orgSlug) || orgs?.[0];

  const { data: channels } = useQuery<ChannelData[]>({
    queryKey: ['channels', currentOrg?.id],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/orgs/${currentOrg!.id}/channels`);
      return data.data;
    },
    enabled: !!currentOrg?.id,
  });

  const filteredChannels = useMemo(() => {
    if (!channels) return { public: [], dm: [] };
    const f = filter.toLowerCase();
    const pub = channels.filter((c) => (c.type === 'PUBLIC' || c.type === 'PRIVATE') && (!f || c.name.toLowerCase().includes(f)));
    const dm = channels.filter((c) => c.type === 'DM' && (!f || c.name.toLowerCase().includes(f)));
    return { public: pub, dm };
  }, [channels, filter]);

  function handleLogout() {
    disconnectSocket();
    api.post('/api/v1/auth/logout').catch(() => {});
    logout();
    navigate('/login');
  }

  function handleChannelClick(ch: ChannelData) {
    const slug = currentOrg?.slug || orgSlug || 'default';
    navigate(`/app/${slug}/${ch.id}`);
  }

  function handleOrgChange(org: OrgData) {
    navigate(`/app/${org.slug}`);
  }

  const userStatus = user?.id ? getStatus(user.id) : 'ONLINE';
  const userStatusColor = userStatus === 'ONLINE' ? 'bg-accent-green' : userStatus === 'AWAY' ? 'bg-accent-yellow' : 'bg-gray-400';

  const connDot = socketStatus === 'connected' ? 'bg-accent-green' : socketStatus === 'reconnecting' ? 'bg-accent-yellow' : 'bg-accent-red';
  const connText = socketStatus === 'connected' ? 'Connected' : socketStatus === 'reconnecting' ? 'Reconnecting...' : 'Disconnected';

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-text">
      <div className="border-b border-white/10 px-4 py-3">
        <select
          className="w-full rounded bg-sidebar-hover px-2 py-1.5 text-sm font-semibold text-white outline-none"
          value={currentOrg?.id || ''}
          onChange={(e) => {
            const org = orgs?.find((o) => o.id === e.target.value);
            if (org) handleOrgChange(org);
          }}
        >
          {orgs?.map((org) => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </select>
      </div>

      <div className="px-3 py-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full rounded bg-sidebar-hover px-2 py-1.5 text-xs text-sidebar-text placeholder:text-sidebar-text-muted outline-none"
          placeholder="Filter channels..."
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1">
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between px-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-sidebar-text-muted">Channels</h3>
            <button onClick={() => setShowCreate(true)} className="text-sidebar-text-muted hover:text-white" title="Create channel">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          {filteredChannels.public.map((ch) => (
            <button
              key={ch.id}
              onClick={() => handleChannelClick(ch)}
              className={`flex w-full items-center rounded px-2 py-1 text-sm transition ${
                ch.id === channelId ? 'bg-sidebar-active text-white' : 'text-sidebar-text hover:bg-sidebar-hover'
              }`}
            >
              <span className="mr-1.5 text-sidebar-text-muted">#</span>
              <span className={ch.unreadCount ? 'font-semibold text-white' : ''}>{ch.name}</span>
              {ch.unreadCount ? (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-red px-1.5 text-xs font-bold text-white">
                  {ch.unreadCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {filteredChannels.dm.length > 0 && (
          <div>
            <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-text-muted">Direct Messages</h3>
            {filteredChannels.dm.map((ch) => (
              <button
                key={ch.id}
                onClick={() => handleChannelClick(ch)}
                className={`flex w-full items-center rounded px-2 py-1 text-sm transition ${
                  ch.id === channelId ? 'bg-sidebar-active text-white' : 'text-sidebar-text hover:bg-sidebar-hover'
                }`}
              >
                <span className="mr-1.5 h-2 w-2 rounded-full bg-accent-green" />
                <span className={ch.unreadCount ? 'font-semibold text-white' : ''}>{ch.name}</span>
                {ch.unreadCount ? (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-red px-1.5 text-xs font-bold text-white">
                    {ch.unreadCount}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center">
          <div
            className="relative mr-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-primary text-sm font-bold text-white"
            onClick={() => navigate('/app/settings')}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded" />
            ) : (
              user?.displayName?.[0]?.toUpperCase() || '?'
            )}
            <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar ${userStatusColor}`} />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-white">{user?.displayName}</p>
            <div className="flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${connDot}`} />
              <span className="text-xs text-sidebar-text-muted">{connText}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="ml-2 rounded p-1 text-sidebar-text-muted hover:bg-sidebar-hover hover:text-white" title="Sign out">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {currentOrg && (
        <CreateChannelModal orgId={currentOrg.id} open={showCreate} onClose={() => setShowCreate(false)} />
      )}
    </aside>
  );
}
