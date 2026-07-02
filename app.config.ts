import type { ConfigContext, ExpoConfig } from 'expo/config';

// Simulator/dev-client loads must use localhost — VPN/LAN IPs like 11.x are blocked by ATS.
process.env.REACT_NATIVE_PACKAGER_HOSTNAME ??= 'localhost';
// Moodle Docker uses 8081/8082 on this machine — keep Metro on a free port.
process.env.RCT_METRO_PORT ??= '8085';

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
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
        NSAllowsLocalNetworking: true,
      },
    },
  },
  android: {
    package: 'com.raztamim.veno',
    permissions: [
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_DATA_SYNC',
      'android.permission.POST_NOTIFICATIONS',
    ],
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
        ios: {
          newArchEnabled: true,
          deploymentTarget: '17.0',
        },
        android: {
          newArchEnabled: true,
          buildReactNativeFromSource: false,
          extraProguardRules: '-keep class com.rnwhisper.** { *; }',
        },
      },
    ],
    'expo-asset',
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
    'expo-notifications',
    './plugins/with-model-download-service.js',
    './plugins/with-prebuilt-react-native.js',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
