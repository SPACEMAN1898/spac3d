import { Redirect } from 'expo-router';
import { useAuthStore } from '../lib/auth';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { accessToken, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1d21' }}>
        <ActivityIndicator size="large" color="#1264a3" />
      </View>
    );
  }

  if (accessToken) {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
