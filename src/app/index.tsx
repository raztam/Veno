import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useSecurityStore } from '@/features/security/security-store';
import { useSecurity } from '@/features/security/use-security';
import { ThemedView } from '@/components/themed-view';

export default function Index() {
  const { isUnlocked } = useSecurity();
  const vaultLockEnabled = useSecurityStore((state) => state.vaultLockEnabled);

  if (vaultLockEnabled === null) {
    return (
      <ThemedView style={styles.loading}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (!vaultLockEnabled || isUnlocked) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Redirect href="/(lock)/lock" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
