import { Stack } from 'expo-router';

import { Radius } from '@/constants/theme';
import { useSecurityGate } from '@/features/security/use-security-gate';
import { useTheme } from '@/hooks/use-theme';

export default function AppLayout() {
  useSecurityGate();
  const theme = useTheme();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="record"
        options={{
          presentation: 'formSheet',
          gestureDirection: 'vertical',
          animation: 'slide_from_bottom',
          sheetAllowedDetents: 'fitToContents',
          sheetGrabberVisible: true,
          sheetCornerRadius: Radius.xl,
          contentStyle: {
            backgroundColor: theme.background,
          },
        }}
      />
      <Stack.Screen name="note/[id]" />
    </Stack>
  );
}
