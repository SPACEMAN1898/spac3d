import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import { useAuthStore } from '../../../lib/auth';
import { SocketEvents, formatDate } from '@clinikchat/shared';

interface MessageData {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  user?: { id: string; displayName: string; avatarUrl: string | null };
}

interface MessagesPage {
  items: MessageData[];
  hasMore: boolean;
  prevCursor: string | null;
}

export default function MessageViewScreen() {
  const { channelId, orgSlug } = useLocalSearchParams<{ channelId: string; orgSlug: string }>();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [message, setMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const { data: channel } = useQuery({
    queryKey: ['channel', channelId],
    queryFn: async () => { const { data } = await api.get(`/api/v1/channels/${channelId}`); return data.data; },
    enabled: !!channelId,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<MessagesPage>({
    queryKey: ['messages', channelId],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) { params.set('cursor', pageParam as string); params.set('direction', 'before'); }
      params.set('limit', '50');
      const { data } = await api.get(`/api/v1/channels/${channelId}/messages?${params}`);
      return data.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? (lastPage.prevCursor ?? undefined) : undefined,
    enabled: !!channelId,
  });

  const allMessages: MessageData[] = data?.pages?.flatMap((p) => p.items) || [];
  const reversedMessages = [...allMessages].reverse();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    type QD = { pages: MessagesPage[]; pageParams: (string | undefined)[] };

    function handleNew(msg: MessageData) {
      if (msg.channelId !== channelId) return;
      queryClient.setQueryData<QD>(['messages', channelId], (old) => {
        if (!old) return old;
        const pages = [...old.pages];
        pages[0] = { ...pages[0], items: [...pages[0].items, msg] };
        return { ...old, pages };
      });
    }

    socket.on(SocketEvents.MESSAGE_NEW, handleNew);
    return () => { socket.off(SocketEvents.MESSAGE_NEW, handleNew); };
  }, [channelId, queryClient]);

  const sendMessage = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed) return;
    const socket = getSocket();
    if (socket) {
      socket.emit(SocketEvents.MESSAGE_NEW, { channelId, content: trimmed });
    }
    setMessage('');
  }, [message, channelId]);

  return (
    <>
      <Stack.Screen options={{ title: channel?.type === 'DM' ? channel?.name : `#${channel?.name || ''}` }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: '#fff' }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={reversedMessages}
          keyExtractor={(item) => item.id}
          inverted
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ padding: 16 }} color="#1264a3" /> : null}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, transform: [{ scaleY: -1 }] }}>
              <Text style={{ color: '#9ca3af', fontSize: 16 }}>No messages yet</Text>
              <Text style={{ color: '#d1d5db', fontSize: 14, marginTop: 4 }}>Start the conversation!</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const prev = index < reversedMessages.length - 1 ? reversedMessages[index + 1] : null;
            const isGrouped = prev?.userId === item.userId;
            const isOwn = item.userId === currentUserId;

            return (
              <View style={{ paddingHorizontal: 16, paddingVertical: isGrouped ? 1 : 8 }}>
                {!isGrouped && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <View style={{
                      width: 32, height: 32, borderRadius: 6,
                      backgroundColor: '#1264a3', justifyContent: 'center', alignItems: 'center', marginRight: 8,
                    }}>
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
                        {item.user?.displayName?.[0]?.toUpperCase() || '?'}
                      </Text>
                    </View>
                    <Text style={{ fontWeight: '600', fontSize: 14, color: '#111827' }}>
                      {item.user?.displayName || 'Unknown'}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>
                      {formatDate(item.createdAt)}
                    </Text>
                    {item.editedAt && <Text style={{ fontSize: 11, color: '#9ca3af', marginLeft: 4 }}>(edited)</Text>}
                  </View>
                )}
                <View style={{ marginLeft: isGrouped ? 40 : 40 }}>
                  <Text style={{ fontSize: 15, color: '#1f2937', lineHeight: 22 }}>{item.content}</Text>
                </View>
              </View>
            );
          }}
        />

        <View style={{
          flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 8,
          borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff',
        }}>
          <TouchableOpacity style={{ padding: 8 }}>
            <Text style={{ fontSize: 20 }}>📎</Text>
          </TouchableOpacity>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            multiline
            style={{
              flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 20,
              paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, maxHeight: 120,
            }}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!message.trim()}
            style={{
              marginLeft: 8, backgroundColor: message.trim() ? '#1264a3' : '#d1d5db',
              borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 18 }}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
