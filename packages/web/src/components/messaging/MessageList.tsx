import { useEffect, useRef, useCallback, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { SocketEvents } from '@clinikchat/shared';
import MessageItem from './MessageItem';

interface AttachmentData {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
  thumbnailUrl?: string | null;
}

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
    email?: string;
    status?: string;
  };
  attachments?: AttachmentData[];
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

    const grouped = items.length > 0 && lastUserId === msg.userId;
    items.push({ type: 'message', data: msg, id: msg.id, isGrouped: grouped });
    lastUserId = msg.userId;
  }

  return items;
}

interface Props {
  channelId: string;
  onEditStart?: (messageId: string, content: string) => void;
  onImageClick?: (url: string, index: number) => void;
  onUserClick?: (user: NonNullable<MessageData['user']>, position: { x: number; y: number }) => void;
}

export default function MessageList({ channelId, onEditStart, onImageClick, onUserClick }: Props) {
  const queryClient = useQueryClient();
  const parentRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [hasNewMessage, setHasNewMessage] = useState(false);

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
    getNextPageParam: (lastPage) => lastPage.hasMore ? (lastPage.prevCursor ?? undefined) : undefined,
    enabled: !!channelId,
  });

  const allMessages: MessageData[] = data?.pages?.flatMap((p) => p.items) || [];
  const items = buildListItems(allMessages);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = items[index];
      if (item.type === 'date-separator') return 40;
      const msg = item.data as MessageData;
      const hasAttachments = msg.attachments && msg.attachments.length > 0;
      if (hasAttachments) return 220;
      return item.isGrouped ? 28 : 56;
    },
    overscan: 10,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    type QueryData = { pages: MessagesPage[]; pageParams: (string | undefined)[] };

    function handleNewMessage(message: MessageData) {
      if (message.channelId !== channelId) return;

      queryClient.setQueryData<QueryData>(['messages', channelId], (old) => {
        if (!old) return old;
        const newPages = [...old.pages];
        const firstPage = { ...newPages[0] };
        firstPage.items = [...firstPage.items, message];
        newPages[0] = firstPage;
        return { ...old, pages: newPages };
      });

      if (!autoScroll) {
        setHasNewMessage(true);
      }
    }

    function handleEditMessage(message: MessageData) {
      if (message.channelId !== channelId) return;
      queryClient.setQueryData<QueryData>(['messages', channelId], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((m) => (m.id === message.id ? message : m)),
          })),
        };
      });
    }

    function handleDeleteMessage(evtData: { messageId: string; channelId: string }) {
      if (evtData.channelId !== channelId) return;
      queryClient.setQueryData<QueryData>(['messages', channelId], (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.filter((m) => m.id !== evtData.messageId),
          })),
        };
      });
    }

    socket.on(SocketEvents.MESSAGE_NEW, handleNewMessage);
    socket.on(SocketEvents.MESSAGE_EDIT, handleEditMessage);
    socket.on(SocketEvents.MESSAGE_DELETE, handleDeleteMessage);

    return () => {
      socket.off(SocketEvents.MESSAGE_NEW, handleNewMessage);
      socket.off(SocketEvents.MESSAGE_EDIT, handleEditMessage);
      socket.off(SocketEvents.MESSAGE_DELETE, handleDeleteMessage);
    };
  }, [channelId, queryClient, autoScroll]);

  useEffect(() => {
    if (autoScroll && items.length > 0) {
      virtualizer.scrollToIndex(items.length - 1, { align: 'end' });
    }
  }, [items.length, autoScroll, virtualizer]);

  const handleScroll = useCallback(() => {
    const el = parentRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isAtBottom = distanceFromBottom < 100;
    setAutoScroll(isAtBottom);
    if (isAtBottom) setHasNewMessage(false);

    if (el.scrollTop < 200 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  function scrollToBottom() {
    virtualizer.scrollToIndex(items.length - 1, { align: 'end' });
    setAutoScroll(true);
    setHasNewMessage(false);
  }

  return (
    <div ref={parentRef} onScroll={handleScroll} className="relative flex-1 overflow-y-auto">
      {hasNewMessage && (
        <button
          onClick={scrollToBottom}
          className="sticky top-0 z-10 mx-auto mt-2 flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-sm text-white shadow-lg hover:bg-primary-hover"
          style={{ display: 'block', left: '50%', transform: 'translateX(-50%)' }}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
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
              data-message-id={msg.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <MessageItem
                message={msg}
                isGrouped={item.isGrouped || false}
                onEditStart={onEditStart}
                onImageClick={onImageClick}
                onUserClick={onUserClick}
              />
            </div>
          );
        })}
      </div>

      {allMessages.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center text-gray-400">
          <svg className="mb-3 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-lg font-medium">No messages yet</p>
          <p className="mt-1 text-sm">Start the conversation!</p>
        </div>
      )}
    </div>
  );
}
