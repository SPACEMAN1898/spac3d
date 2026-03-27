import { useCallback, useEffect, useRef, useState } from "react";
import { SOCKET_EVENTS } from "@clinikchat/shared";
import type { Socket } from "socket.io-client";

export function MessageInput({
  channelId,
  organizationId,
  onSend,
  socket,
  typingUsers,
}: {
  channelId: string;
  organizationId: string;
  onSend: (text: string) => Promise<void>;
  socket: Socket | null;
  typingUsers: string[];
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTyping = useCallback(() => {
    if (socket) {
      socket.emit(SOCKET_EVENTS.TYPING_STOP, { channelId });
    }
  }, [channelId, socket]);

  const scheduleStopTyping = useCallback(() => {
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  }, [stopTyping]);

  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      stopTyping();
    };
  }, [channelId, stopTyping]);

  async function submit() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setText("");
      stopTyping();
    } finally {
      setSending(false);
    }
  }

  function onChange(val: string) {
    setText(val);
    if (socket && val.trim()) {
      socket.emit(SOCKET_EVENTS.TYPING_START, { channelId, organizationId });
      scheduleStopTyping();
    } else if (socket) {
      stopTyping();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  }

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-3">
      {typingUsers.length > 0 && (
        <p className="mb-2 text-xs text-slate-500">
          {typingUsers.length === 1
            ? "Someone is typing…"
            : `${typingUsers.length} people are typing…`}
        </p>
      )}
      <div className="flex gap-2">
        <textarea
          rows={2}
          className="min-h-[44px] flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Message… (Enter to send, Shift+Enter for newline)"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => stopTyping()}
        />
        <button
          type="button"
          disabled={sending || !text.trim()}
          onClick={() => void submit()}
          className="self-end rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
