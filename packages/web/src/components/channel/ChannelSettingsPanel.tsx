import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { usePresenceStore } from '../../stores/presenceStore';

interface Props {
  channelId: string;
  onClose: () => void;
  onStartDm: (userId: string) => void;
}

interface MemberData {
  channelId: string;
  userId: string;
  role: string;
  user: { id: string; displayName: string; avatarUrl: string | null; status: string; email: string };
}

export default function ChannelSettingsPanel({ channelId, onClose, onStartDm }: Props) {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const getStatus = usePresenceStore((s) => s.getStatus);
  const [editName, setEditName] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editing, setEditing] = useState(false);

  const { data: channel } = useQuery({
    queryKey: ['channel', channelId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/channels/${channelId}`);
      return data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, string> = {};
      if (editName.trim()) body.name = editName;
      if (editTopic !== undefined) body.topic = editTopic;
      await api.patch(`/api/v1/channels/${channelId}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel', channelId] });
      setEditing(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/api/v1/channels/${channelId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel', channelId] });
    },
  });

  const members: MemberData[] = channel?.members || [];

  const statusColor = (userId: string) => {
    const s = getStatus(userId);
    if (s === 'ONLINE') return 'bg-accent-green';
    if (s === 'AWAY') return 'bg-accent-yellow';
    return 'bg-gray-400';
  };

  return (
    <div className="flex h-full w-80 flex-col border-l border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold text-gray-900">Channel Details</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {editing ? (
          <div className="mb-4 space-y-3">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="Channel name"
            />
            <input
              value={editTopic}
              onChange={(e) => setEditTopic(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="Topic"
            />
            <div className="flex gap-2">
              <button onClick={() => updateMutation.mutate()} className="rounded bg-primary px-3 py-1.5 text-sm text-white">Save</button>
              <button onClick={() => setEditing(false)} className="rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <h4 className="text-lg font-semibold">#{channel?.name}</h4>
            <p className="mt-1 text-sm text-gray-500">{channel?.topic || 'No topic set'}</p>
            <button
              onClick={() => { setEditName(channel?.name || ''); setEditTopic(channel?.topic || ''); setEditing(true); }}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Edit
            </button>
          </div>
        )}

        <h4 className="mb-2 text-sm font-semibold text-gray-700">Members ({members.length})</h4>
        <div className="space-y-1">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50">
              <div className="relative flex h-7 w-7 items-center justify-center rounded bg-primary text-xs font-bold text-white">
                {m.user.avatarUrl ? (
                  <img src={m.user.avatarUrl} alt="" className="h-7 w-7 rounded" />
                ) : (
                  m.user.displayName[0]?.toUpperCase()
                )}
                <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${statusColor(m.userId)}`} />
              </div>
              <div className="flex-1 overflow-hidden">
                <span className="truncate text-sm">{m.user.displayName}</span>
                {m.role !== 'MEMBER' && (
                  <span className="ml-1 text-xs text-gray-400">{m.role.toLowerCase()}</span>
                )}
              </div>
              {m.userId !== currentUserId && (
                <div className="flex gap-1">
                  <button
                    onClick={() => onStartDm(m.userId)}
                    title="Send DM"
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeMutation.mutate(m.userId)}
                    title="Remove from channel"
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
