import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { SecurityProvider } from '@/features/security/security-provider';
import { DatabaseProvider } from '@/providers/database-provider';
import { QueryProvider } from '@/providers/query-provider';

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
  );
}
