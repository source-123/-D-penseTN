import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: 'DépenseTN',
  slug: 'depensetn',
  scheme: 'depensetn',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  icon: './assets/icon.png',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'tn.depensetn.app',
    infoPlist: {
      UIBackgroundModes: ['remote-notification'],
      NSMicrophoneUsageDescription:
        'DépenseTN a besoin du micro pour la saisie vocale.',
      NSSpeechRecognitionUsageDescription:
        'DépenseTN utilise la reconnaissance vocale pour créer des transactions.',
    },
  },
  android: {
    package: 'tn.depensetn.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0A0E14',
    },
    permissions: [
      'NOTIFICATIONS',
      'POST_NOTIFICATIONS',
      'VIBRATE',
      'RECEIVE_BOOT_COMPLETED',
      'RECORD_AUDIO',
    ],
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/splash.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#0A0E14',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/icon.png',
        color: '#10B981',
        sounds: [],
      },
    ],
    [
      'expo-speech-recognition',
      {
        microphonePermission:
          'Autorise DépenseTN à accéder au micro pour la saisie vocale.',
        speechRecognitionPermission:
          'Autorise DépenseTN à utiliser la reconnaissance vocale.',
        androidSpeechServicePackages: [
          'com.google.android.googlequicksearchbox',
        ],
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: '3777c346-aa16-4343-b638-d6727288e8e7',
    },
    firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  },
});
