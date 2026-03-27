import { useState, useEffect } from 'react';
import { getSocket } from '../../lib/socket';
import { SocketEvents } from '@clinikchat/shared';
import { useAuthStore } from '../../stores/authStore';

interface TypingIndicatorProps {
  channelId: string;
}

export default function TypingIndicator({ channelId }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const currentUserId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function handleTypingStart(data: { userId: string; channelId: string }) {
      if (data.channelId !== channelId || data.userId === currentUserId) return;
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.set(data.userId, data.userId);
        return next;
      });
    }

    function handleTypingStop(data: { userId: string; channelId: string }) {
      if (data.channelId !== channelId) return;
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    }

    socket.on(SocketEvents.TYPING_START, handleTypingStart);
    socket.on(SocketEvents.TYPING_STOP, handleTypingStop);

    return () => {
      socket.off(SocketEvents.TYPING_START, handleTypingStart);
      socket.off(SocketEvents.TYPING_STOP, handleTypingStop);
      setTypingUsers(new Map());
    };
  }, [channelId, currentUserId]);

  if (typingUsers.size === 0) {
    return <div className="h-5 px-6" />;
  }

  const count = typingUsers.size;
  const text =
    count === 1
      ? 'Someone is typing...'
      : count <= 3
        ? `${count} people are typing...`
        : 'Several people are typing...';

  return (
    <div className="flex h-5 items-center px-6 text-xs text-gray-400">
      <span className="mr-1 inline-flex gap-0.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
      </span>
      {text}
    </div>
  );
}
