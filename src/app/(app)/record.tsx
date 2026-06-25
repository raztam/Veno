import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function RecordScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle">Record</ThemedText>
        <Button label="Close" onPress={() => router.back()} size="sm" variant="ghost" />
      </View>

      <Card style={styles.card} variant="filled">
        <View style={styles.micPlaceholder}>
          <ThemedText themeColor="textSecondary" type="subtitle">
            🎙
          </ThemedText>
        </View>
        <ThemedText style={styles.cardTitle} type="subtitle">
          Ready when you are
        </ThemedText>
        <ThemedText style={styles.cardBody} themeColor="textSecondary">
          Tap the button below to start capturing your voice note. Audio recording arrives in Stage
          4.
        </ThemedText>
        <Button disabled fullWidth label="Start Recording" />
      </Card>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  card: {
    gap: Spacing.md,
  },
  micPlaceholder: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    textAlign: 'center',
  },
  cardBody: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
});
