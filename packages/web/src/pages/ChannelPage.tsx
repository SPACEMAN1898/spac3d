import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ROUTES, SOCKET_EVENTS } from "@clinikchat/shared";
import type { Message } from "@clinikchat/shared";
import { api } from "../lib/api.js";
import { connectSocket, getSocket } from "../lib/socket.js";
import { useOrgBySlug } from "../hooks/useOrgBySlug.js";
import { MessageList } from "../components/MessageList.js";
import { MessageInput } from "../components/MessageInput.js";

export function ChannelPage() {
  const { orgSlug, channelId } = useParams();
  const { org } = useOrgBySlug(orgSlug);
  const orgId = org?.id;
  const queryClient = useQueryClient();
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);

  const messagesQuery = useInfiniteQuery({
    queryKey: ["messages", orgId, channelId],
    enabled: Boolean(orgId && channelId && channelId !== "new"),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<{
        success: true;
        data: { messages: Message[]; nextCursor: string | null };
      }>(API_ROUTES.MESSAGES.LIST(orgId!, channelId!), {
        params: { cursor: pageParam, limit: 50 },
      });
      return data.data;
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const flatMessages = useMemo(() => {
    const pages = messagesQuery.data?.pages ?? [];
    const map = new Map<string, Message>();
    for (const p of pages) {
      for (const m of p.messages) {
        map.set(m.id, m);
      }
    }
    return [...map.values()].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [messagesQuery.data]);

  const markRead = useCallback(
    async (lastId: string) => {
      if (!orgId || !channelId || channelId === "new") return;
      await api.post(API_ROUTES.MESSAGES.READ(orgId, channelId), { lastMessageId: lastId });
      void queryClient.invalidateQueries({ queryKey: ["channels", orgId] });
    },
    [orgId, channelId, queryClient],
  );

  const sendMut = useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post<{ success: true; data: Message }>(
        API_ROUTES.MESSAGES.LIST(orgId!, channelId!),
        { content },
      );
      return data.data;
    },
    onSuccess: async (msg) => {
      void queryClient.invalidateQueries({ queryKey: ["messages", orgId, channelId] });
      if (orgId && channelId && channelId !== "new") {
        await api.post(API_ROUTES.MESSAGES.READ(orgId, channelId), {
          lastMessageId: msg.id,
        });
        void queryClient.invalidateQueries({ queryKey: ["channels", orgId] });
      }
    },
  });

  const lastMessage = flatMessages[flatMessages.length - 1];
  const lastId = lastMessage?.id;
  const lastDeleted = lastMessage?.deletedAt;

  useEffect(() => {
    if (!lastId || lastDeleted) return;
    void markRead(lastId);
  }, [lastId, lastDeleted, markRead]);

  useEffect(() => {
    if (!channelId || channelId === "new" || !orgId) return;
    let sock = getSocket();
    if (!sock) {
      try {
        sock = connectSocket();
      } catch {
        return;
      }
    }
    sock.emit(SOCKET_EVENTS.JOIN_CHANNEL, { channelId });

    const invalidateMessages = () => {
      void queryClient.invalidateQueries({ queryKey: ["messages", orgId, channelId] });
    };

    const onNew = (m: Message) => {
      if (m.channelId !== channelId) return;
      invalidateMessages();
      void queryClient.invalidateQueries({ queryKey: ["channels", orgId] });
    };

    const onUpdated = (m: Message) => {
      if (m.channelId !== channelId) return;
      invalidateMessages();
    };

    const onDeleted = (payload: { id: string; channelId: string }) => {
      if (payload.channelId !== channelId) return;
      invalidateMessages();
    };

    const onTypingStart = (p: { channelId: string; userId: string }) => {
      if (p.channelId !== channelId) return;
      setTypingUserIds((prev) => (prev.includes(p.userId) ? prev : [...prev, p.userId]));
    };
    const onTypingStop = (p: { channelId: string; userId: string }) => {
      if (p.channelId !== channelId) return;
      setTypingUserIds((prev) => prev.filter((id) => id !== p.userId));
    };

    sock.on(SOCKET_EVENTS.MESSAGE_NEW, onNew);
    sock.on(SOCKET_EVENTS.MESSAGE_UPDATED, onUpdated);
    sock.on(SOCKET_EVENTS.MESSAGE_DELETED, onDeleted);
    sock.on(SOCKET_EVENTS.TYPING_START, onTypingStart);
    sock.on(SOCKET_EVENTS.TYPING_STOP, onTypingStop);

    return () => {
      sock.off(SOCKET_EVENTS.MESSAGE_NEW, onNew);
      sock.off(SOCKET_EVENTS.MESSAGE_UPDATED, onUpdated);
      sock.off(SOCKET_EVENTS.MESSAGE_DELETED, onDeleted);
      sock.off(SOCKET_EVENTS.TYPING_START, onTypingStart);
      sock.off(SOCKET_EVENTS.TYPING_STOP, onTypingStop);
      sock.emit(SOCKET_EVENTS.LEAVE_CHANNEL, { channelId });
    };
  }, [channelId, orgId, queryClient]);

  if (!orgId || !channelId) {
    return <div className="p-6 text-slate-600">Loading…</div>;
  }

  if (channelId === "new") {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-600">
        Select a channel from the sidebar.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <header className="border-b border-slate-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-slate-900">Channel</h1>
        <p className="text-xs text-slate-500">{org?.name}</p>
      </header>
      {messagesQuery.isLoading ? (
        <div className="flex flex-1 items-center justify-center text-slate-500">
          Loading messages…
        </div>
      ) : (
        <MessageList messages={flatMessages} />
      )}
      <MessageInput
        channelId={channelId}
        organizationId={orgId}
        socket={getSocket()}
        typingUsers={typingUserIds}
        onSend={async (t) => {
          await sendMut.mutateAsync(t);
        }}
      />
    </div>
  );
}
