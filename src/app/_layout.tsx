import '@/polyfills';

import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors } from '@/constants/theme';
import { EntitlementsProvider } from '@/features/entitlements/entitlements-provider';
import { SecurityProvider } from '@/features/security/security-provider';
import { Sentry } from '@/features/telemetry/sentry';
import { DatabaseProvider } from '@/providers/database-provider';
import { QueryProvider } from '@/providers/query-provider';
import { ModelDownloadProvider } from '@/features/models/model-download-provider';
import { SummarizeProvider } from '@/features/summarize/summarize-provider';
import { TranscriptionProvider } from '@/features/transcription/transcription-provider';

function RootLayout() {
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
          <EntitlementsProvider>
          <ModelDownloadProvider>
            <TranscriptionProvider>
              <SummarizeProvider>
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
              </SummarizeProvider>
            </TranscriptionProvider>
          </ModelDownloadProvider>
          </EntitlementsProvider>
        </DatabaseProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
