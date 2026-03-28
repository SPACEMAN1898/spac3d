import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'ClinikChat',
  slug: 'clinikchat',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'clinikchat',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#1a1d21',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.clinikchat.app',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1a1d21',
    },
    package: 'com.clinikchat.app',
    permissions: ['INTERNET', 'CAMERA', 'READ_EXTERNAL_STORAGE'],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#1264a3',
      },
    ],
    'expo-image-picker',
  ],
  extra: {
    apiUrl: process.env.API_URL || 'http://localhost:3001',
    eas: {
      projectId: 'your-project-id',
    },
  },
  experiments: {
    typedRoutes: true,
  },
});
