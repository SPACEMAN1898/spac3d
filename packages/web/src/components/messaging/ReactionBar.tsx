import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/api';

interface ReactionGroup {
  emoji: string;
  count: number;
  userIds: string[];
}

interface Props {
  messageId: string;
  reactions: ReactionGroup[];
  onUpdate: () => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '👀', '🚀'];

export default function ReactionBar({ messageId, reactions, onUpdate }: Props) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [showPicker, setShowPicker] = useState(false);

  async function toggleReaction(emoji: string) {
    const existing = reactions.find((r) => r.emoji === emoji);
    const hasReacted = existing?.userIds.includes(currentUserId || '');

    try {
      if (hasReacted) {
        await api.delete(`/api/v1/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
      } else {
        await api.post(`/api/v1/messages/${messageId}/reactions`, { emoji });
      }
      onUpdate();
    } catch {
      // ignore
    }
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {reactions.map((r) => {
        const mine = r.userIds.includes(currentUserId || '');
        return (
          <button
            key={r.emoji}
            onClick={() => toggleReaction(r.emoji)}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${
              mine ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{r.emoji}</span>
            <span className="font-medium">{r.count}</span>
          </button>
        );
      })}

      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title="Add reaction"
        >
          +
        </button>
        {showPicker && (
          <div className="absolute bottom-8 left-0 z-20 flex gap-1 rounded-lg border bg-white p-2 shadow-lg">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { toggleReaction(emoji); setShowPicker(false); }}
                className="rounded p-1 text-lg hover:bg-gray-100"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
