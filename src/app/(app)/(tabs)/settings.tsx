import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function SettingsScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ThemedText style={styles.header} type="title">
          Settings
        </ThemedText>

        <Card style={styles.section}>
          <ThemedText type="subtitle">Vault</ThemedText>
          <ThemedText themeColor="textSecondary">
            Your notes and recordings stay on this device. Biometric lock arrives in Stage 2.
          </ThemedText>
        </Card>

        <Card style={styles.section}>
          <ThemedText type="subtitle">Pro</ThemedText>
          <ThemedText themeColor="textSecondary">
            Unlimited recordings and smart summaries will be available with a Pro subscription in
            Stage 7.
          </ThemedText>
        </Card>

        <Card style={styles.section}>
          <ThemedText type="subtitle">About</ThemedText>
          <ThemedText themeColor="textSecondary">
            Veno — Speak it. We&apos;ll write it down, summarize it, and pull out your tasks.
          </ThemedText>
        </Card>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  section: {
    gap: Spacing.sm,
  },
});
