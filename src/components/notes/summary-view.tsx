import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type SummaryViewProps = {
  summary: string;
};

function parseSummaryBullets(summary: string): string[] {
  return summary
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
}

export function SummaryView({ summary }: SummaryViewProps) {
  const bullets = parseSummaryBullets(summary);

  if (bullets.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle">Summary</ThemedText>
      {bullets.map((bullet, index) => (
        <View key={`${index}-${bullet}`} style={styles.bulletRow}>
          <ThemedText style={styles.bulletMarker} themeColor="textSecondary">
            •
          </ThemedText>
          <ThemedText style={styles.bulletText}>{bullet}</ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  bulletMarker: {
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    lineHeight: 22,
  },
});
