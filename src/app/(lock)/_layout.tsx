import { Stack } from 'expo-router';

export default function LockLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="lock" />
    </Stack>
  );
}
