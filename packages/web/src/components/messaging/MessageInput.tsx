import { useState, useRef, useCallback } from 'react';
import { getSocket } from '../../lib/socket';
import { SocketEvents } from '@clinikchat/shared';

interface MessageInputProps {
  channelId: string;
}

export default function MessageInput({ channelId }: MessageInputProps) {
  const [content, setContent] = useState('');
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);

  const emitTypingStart = useCallback(() => {
    const socket = getSocket();
    if (!socket || isTyping.current) return;
    isTyping.current = true;
    socket.emit(SocketEvents.TYPING_START, { channelId });
  }, [channelId]);

  const emitTypingStop = useCallback(() => {
    const socket = getSocket();
    if (!socket || !isTyping.current) return;
    isTyping.current = false;
    socket.emit(SocketEvents.TYPING_STOP, { channelId });
  }, [channelId]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    emitTypingStart();

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      emitTypingStop();
    }, 3000);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function sendMessage() {
    const trimmed = content.trim();
    if (!trimmed) return;

    const socket = getSocket();
    if (socket) {
      socket.emit(SocketEvents.MESSAGE_NEW, { channelId, content: trimmed });
    }

    setContent('');
    emitTypingStop();
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  }

  return (
    <div className="border-t border-gray-200 px-6 py-3">
      <div className="flex items-end rounded-lg border border-gray-300 bg-white p-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
        <textarea
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none"
          style={{ minHeight: '24px' }}
        />
        <button
          onClick={sendMessage}
          disabled={!content.trim()}
          className="ml-2 rounded bg-primary p-1.5 text-white transition hover:bg-primary-hover disabled:opacity-30"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
