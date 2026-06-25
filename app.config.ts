import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Veno',
  slug: 'Veno',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'veno',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.raztamim.veno',
    icon: './assets/expo.icon',
  },
  android: {
    package: 'com.raztamim.veno',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'server',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-build-properties',
      {
        buildReactNativeFromSource: true,
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        android: {
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      },
    ],
    'expo-sqlite',
    [
      'expo-audio',
      {
        microphonePermission: 'Allow Veno to access your microphone to record voice notes.',
      },
    ],
    [
      'expo-local-authentication',
      {
        faceIDPermission: 'Allow Veno to use Face ID to protect your notes.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
