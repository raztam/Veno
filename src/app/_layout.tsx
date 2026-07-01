import '@/polyfills';

import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors } from '@/constants/theme';
import { SecurityProvider } from '@/features/security/security-provider';
import { DatabaseProvider } from '@/providers/database-provider';
import { QueryProvider } from '@/providers/query-provider';
import { ModelDownloadProvider } from '@/features/models/model-download-provider';
import { SummarizeProvider } from '@/features/summarize/summarize-provider';
import { TranscriptionProvider } from '@/features/transcription/transcription-provider';

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
        </DatabaseProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
