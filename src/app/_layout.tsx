import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors } from '@/constants/theme';
import { SecurityProvider } from '@/features/security/security-provider';
import { installDevLogger } from '@/features/telemetry/install-dev-logger';
import { DatabaseProvider } from '@/providers/database-provider';
import { QueryProvider } from '@/providers/query-provider';

if (Platform.OS === 'ios' || Platform.OS === 'android') {
  installDevLogger();
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = Colors[scheme];

  const navigationTheme =
    scheme === 'dark'
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: palette.background,
            card: palette.backgroundElement,
            text: palette.text,
            border: palette.border,
            primary: palette.tint,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: palette.background,
            card: palette.backgroundElement,
            text: palette.text,
            border: palette.border,
            primary: palette.tint,
          },
        };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <DatabaseProvider>
          <SecurityProvider>
            <ThemeProvider value={navigationTheme}>
              <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(lock)" options={{ animation: 'fade' }} />
                <Stack.Screen name="(app)" />
              </Stack>
            </ThemeProvider>
          </SecurityProvider>
        </DatabaseProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
