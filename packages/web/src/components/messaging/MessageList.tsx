import { useEffect, useRef, useCallback, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { SocketEvents, formatDate } from '@clinikchat/shared';
import MessageItem from './MessageItem';

interface MessageData {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  type: string;
  parentId: string | null;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    status: string;
  };
  attachments?: unknown[];
}

interface MessagesPage {
  items: MessageData[];
  hasMore: boolean;
  nextCursor: string | null;
  prevCursor: string | null;
}

interface ListItem {
  type: 'message' | 'date-separator';
  data: MessageData | string;
  id: string;
  isGrouped?: boolean;
}

function buildListItems(messages: MessageData[]): ListItem[] {
  const items: ListItem[] = [];
  let lastDate = '';
  let lastUserId = '';

  for (const msg of messages) {
    const date = new Date(msg.createdAt).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    if (date !== lastDate) {
      items.push({ type: 'date-separator', data: date, id: `sep-${date}` });
      lastDate = date;
      lastUserId = '';
    }

    const timeDiff = items.length > 0 && lastUserId === msg.userId;
    items.push({
      type: 'message',
      data: msg,
      id: msg.id,
      isGrouped: timeDiff,
    });
    lastUserId = msg.userId;
  }

  return items;
}

export default function MessageList({ channelId }: { channelId: string }) {
  const queryClient = useQueryClient();
  const parentRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<MessagesPage, Error, { pages: MessagesPage[]; pageParams: (string | undefined)[] }, string[], string | undefined>({
    queryKey: ['messages', channelId],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) {
        params.set('cursor', pageParam);
        params.set('direction', 'before');
      }
      params.set('limit', '50');
      const { data } = await api.get(`/api/v1/channels/${channelId}/messages?${params}`);
      return data.data as MessagesPage;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.prevCursor ?? undefined) : undefined,
    enabled: !!channelId,
  });

  const allMessages: MessageData[] = data?.pages?.flatMap((p) => p.items) || [];
  const items = buildListItems(allMessages);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (items[index].type === 'date-separator' ? 40 : items[index].isGrouped ? 28 : 56),
    overscan: 10,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    type QueryData = { pages: MessagesPage[]; pageParams: (string | undefined)[] };

    function handleNewMessage(message: MessageData) {
      if (message.channelId !== channelId) return;
      queryClient.setQueryData<QueryData>(
        ['messages', channelId],
        (old) => {
          if (!old) return old;
          const newPages = [...old.pages];
          const lastPage = { ...newPages[0] };
          lastPage.items = [...lastPage.items, message];
          newPages[0] = lastPage;
          return { ...old, pages: newPages };
        },
      );
    }

    function handleEditMessage(message: MessageData) {
      if (message.channelId !== channelId) return;
      queryClient.setQueryData<QueryData>(
        ['messages', channelId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((m) => (m.id === message.id ? message : m)),
            })),
          };
        },
      );
    }

    function handleDeleteMessage(evtData: { messageId: string; channelId: string }) {
      if (evtData.channelId !== channelId) return;
      queryClient.setQueryData<QueryData>(
        ['messages', channelId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.filter((m) => m.id !== evtData.messageId),
            })),
          };
        },
      );
    }

    socket.on(SocketEvents.MESSAGE_NEW, handleNewMessage);
    socket.on(SocketEvents.MESSAGE_EDIT, handleEditMessage);
    socket.on(SocketEvents.MESSAGE_DELETE, handleDeleteMessage);

    return () => {
      socket.off(SocketEvents.MESSAGE_NEW, handleNewMessage);
      socket.off(SocketEvents.MESSAGE_EDIT, handleEditMessage);
      socket.off(SocketEvents.MESSAGE_DELETE, handleDeleteMessage);
    };
  }, [channelId, queryClient]);

  useEffect(() => {
    if (autoScroll && items.length > 0) {
      virtualizer.scrollToIndex(items.length - 1, { align: 'end' });
    }
  }, [items.length, autoScroll, virtualizer]);

  const handleScroll = useCallback(() => {
    const el = parentRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAutoScroll(distanceFromBottom < 100);

    if (el.scrollTop < 200 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div ref={parentRef} onScroll={handleScroll} className="relative flex-1 overflow-y-auto">
      {!autoScroll && items.length > 0 && (
        <button
          onClick={() => {
            virtualizer.scrollToIndex(items.length - 1, { align: 'end' });
            setAutoScroll(true);
          }}
          className="fixed bottom-24 right-8 z-10 rounded-full bg-primary px-4 py-2 text-sm text-white shadow-lg hover:bg-primary-hover"
        >
          New messages
        </button>
      )}

      <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index];

          if (item.type === 'date-separator') {
            return (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: virtualItem.size,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className="flex items-center px-6"
              >
                <div className="flex-1 border-t border-gray-200" />
                <span className="mx-3 text-xs font-medium text-gray-500">{item.data as string}</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>
            );
          }

          const msg = item.data as MessageData;
          return (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: virtualItem.size,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <MessageItem message={msg} isGrouped={item.isGrouped || false} />
            </div>
          );
        })}
      </div>

      {allMessages.length === 0 && (
        <div className="flex h-full items-center justify-center text-gray-400">
          No messages yet. Start the conversation!
        </div>
      )}
    </div>
  );
}
