import { useEffect } from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '../../lib/auth';
import { connectSocket, disconnectSocket } from '../../lib/socket';
import * as Notifications from 'expo-notifications';
import api from '../../lib/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function AppLayout() {
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (accessToken) {
      connectSocket();
      registerPushToken();
    }
    return () => { disconnectSocket(); };
  }, [accessToken]);

  if (!accessToken) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack>
      <Stack.Screen name="[orgSlug]/index" options={{ title: 'Channels', headerStyle: { backgroundColor: '#1a1d21' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="[orgSlug]/[channelId]" options={{ headerStyle: { backgroundColor: '#1a1d21' }, headerTintColor: '#fff' }} />
    </Stack>
  );
}

async function registerPushToken() {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    await api.post('/api/v1/users/me/push-token', {
      token: tokenData.data,
      platform: 'expo',
    });
  } catch {
    // push token registration is best-effort
  }
}
