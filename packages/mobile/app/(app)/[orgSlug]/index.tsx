import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth';
import { truncateText } from '@clinikchat/shared';

interface ChannelData {
  id: string;
  name: string;
  type: string;
  topic: string | null;
  unreadCount?: number;
  messageCount?: number;
}

interface OrgData {
  id: string;
  name: string;
  slug: string;
}

export default function ChannelListScreen() {
  const { orgSlug } = useLocalSearchParams<{ orgSlug: string }>();
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  const [refreshing, setRefreshing] = useState(false);

  const { data: orgs } = useQuery<OrgData[]>({
    queryKey: ['orgs'],
    queryFn: async () => { const { data } = await api.get('/api/v1/orgs'); return data.data; },
  });

  const currentOrg = orgs?.find((o) => o.slug === orgSlug) || orgs?.[0];

  const { data: channels, isLoading } = useQuery<ChannelData[]>({
    queryKey: ['channels', currentOrg?.id],
    queryFn: async () => { const { data } = await api.get(`/api/v1/orgs/${currentOrg!.id}/channels`); return data.data; },
    enabled: !!currentOrg?.id,
  });

  useEffect(() => {
    if (currentOrg && !orgSlug) {
      router.replace(`/(app)/${currentOrg.slug}`);
    }
  }, [currentOrg, orgSlug]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['channels'] });
    setRefreshing(false);
  }, [queryClient]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#1264a3" />
      </View>
    );
  }

  const publicChannels = channels?.filter((c) => c.type !== 'DM') || [];
  const dmChannels = channels?.filter((c) => c.type === 'DM') || [];

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <FlatList
        data={[...publicChannels, ...dmChannels]}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1264a3" />}
        ListHeaderComponent={
          <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#111827' }}>{currentOrg?.name || 'Channels'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/(app)/${orgSlug || currentOrg?.slug}/${item.id}`)}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: item.type === 'DM' ? '#007a5a' : '#1264a3', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
                {item.type === 'DM' ? '💬' : '#'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: item.unreadCount ? '700' : '500', color: '#111827' }}>
                {item.name}
              </Text>
              {item.topic && (
                <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>
                  {truncateText(item.topic, 50)}
                </Text>
              )}
            </View>
            {item.unreadCount ? (
              <View style={{ backgroundColor: '#e01e5a', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, minWidth: 24, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{item.unreadCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ color: '#9ca3af', fontSize: 16 }}>No channels yet</Text>
          </View>
        }
      />

      <TouchableOpacity
        onPress={() => logout().then(() => router.replace('/(auth)/login'))}
        style={{ position: 'absolute', bottom: 24, right: 24, backgroundColor: '#e01e5a', borderRadius: 28, width: 56, height: 56, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 }}
      >
        <Text style={{ color: '#fff', fontSize: 24 }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
