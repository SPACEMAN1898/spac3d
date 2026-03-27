import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import MessageList from '../components/messaging/MessageList';
import MessageInput from '../components/messaging/MessageInput';
import TypingIndicator from '../components/messaging/TypingIndicator';
import ChannelSettingsPanel from '../components/channel/ChannelSettingsPanel';
import SearchPanel from '../components/search/SearchPanel';
import UserPopover from '../components/user/UserPopover';
import Lightbox from '../components/file/Lightbox';

export default function ChannelView() {
  const { channelId, orgSlug } = useParams<{ channelId: string; orgSlug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);
  const [popover, setPopover] = useState<{ user: { id: string; displayName: string; avatarUrl: string | null; email?: string }; position: { x: number; y: number } } | null>(null);
  const [lightbox, setLightbox] = useState<{ images: { url: string; filename: string }[]; index: number } | null>(null);

  const { data: channel } = useQuery({
    queryKey: ['channel', channelId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/channels/${channelId}`);
      return data.data;
    },
    enabled: !!channelId,
  });

  const { data: orgs } = useQuery({
    queryKey: ['orgs'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/orgs');
      return data.data;
    },
  });

  const currentOrg = orgs?.find((o: { slug: string }) => o.slug === orgSlug) || orgs?.[0];

  if (!channelId) return null;

  async function handleStartDm(targetUserId: string) {
    if (!currentOrg) return;
    try {
      const { data } = await api.post(`/api/v1/orgs/${currentOrg.id}/dm`, { targetUserId });
      queryClient.invalidateQueries({ queryKey: ['channels', currentOrg.id] });
      navigate(`/app/${currentOrg.slug}/${data.data.id}`);
    } catch {
      // DM creation failed
    }
    setPopover(null);
    setShowSettings(false);
  }

  function handleEditStart(messageId: string, content: string) {
    setEditingMessage({ id: messageId, content });
  }

  function handleImageClick(url: string, _index: number) {
    setLightbox({ images: [{ url, filename: 'image' }], index: 0 });
  }

  function handleUserClick(user: { id: string; displayName: string; avatarUrl: string | null; email?: string }, position: { x: number; y: number }) {
    setPopover({ user, position });
  }

  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col">
        <div className="flex items-center border-b border-gray-200 px-6 py-3">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              {channel?.type === 'DM' ? '' : '# '}{channel?.name || 'Loading...'}
            </h2>
            {channel?.topic && <p className="text-sm text-gray-500">{channel.topic}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowSearch(!showSearch); setShowSettings(false); }}
              className={`rounded p-1.5 ${showSearch ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
              title="Search"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button
              onClick={() => { setShowSettings(!showSettings); setShowSearch(false); }}
              className={`rounded p-1.5 ${showSettings ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
              title="Channel details"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <span className="text-sm text-gray-400">{channel?.members?.length || 0} members</span>
          </div>
        </div>

        <MessageList
          channelId={channelId}
          onEditStart={handleEditStart}
          onImageClick={handleImageClick}
          onUserClick={handleUserClick}
        />
        <TypingIndicator channelId={channelId} />
        <MessageInput
          channelId={channelId}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
        />
      </div>

      {showSettings && (
        <ChannelSettingsPanel
          channelId={channelId}
          onClose={() => setShowSettings(false)}
          onStartDm={handleStartDm}
        />
      )}

      {showSearch && (
        <SearchPanel
          channelId={channelId}
          onClose={() => setShowSearch(false)}
          onScrollToMessage={() => {}}
        />
      )}

      {popover && (
        <UserPopover
          user={popover.user}
          position={popover.position}
          onClose={() => setPopover(null)}
          onDm={() => handleStartDm(popover.user.id)}
        />
      )}

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          currentIndex={lightbox.index}
          onClose={() => setLightbox(null)}
          onNavigate={(i) => setLightbox((prev) => prev ? { ...prev, index: i } : null)}
        />
      )}
    </div>
  );
}
