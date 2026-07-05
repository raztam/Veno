import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/themed-text';
import { FREE_FEATURES, PRO_FEATURES } from '@/constants/entitlements';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function FeatureRow({ text, highlighted }: { text: string; highlighted?: boolean }) {
  const theme = useTheme();

  return (
    <View style={styles.featureRow}>
      <ThemedText style={{ color: highlighted ? theme.tint : theme.success }} type="smallBold">
        ✓
      </ThemedText>
      <ThemedText style={styles.featureText} themeColor="textSecondary" type="small">
        {text}
      </ThemedText>
    </View>
  );
}

export function TierComparison() {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <Card style={styles.tierCard} variant="filled">
        <ThemedText type="subtitle">Free</ThemedText>
        <View style={styles.features}>
          {FREE_FEATURES.map((feature) => (
            <FeatureRow key={feature} text={feature} />
          ))}
        </View>
      </Card>

      <Card
        style={[styles.tierCard, styles.proCard, { borderColor: theme.tint }]}
        variant="outlined">
        <View style={styles.proHeader}>
          <ThemedText type="subtitle">Pro</ThemedText>
          <View style={[styles.badge, { backgroundColor: theme.tint }]}>
            <ThemedText style={styles.badgeText} type="smallBold">
              BEST
            </ThemedText>
          </View>
        </View>
        <View style={styles.features}>
          {PRO_FEATURES.map((feature) => (
            <FeatureRow highlighted key={feature} text={feature} />
          ))}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tierCard: {
    flex: 1,
    gap: Spacing.sm,
  },
  proCard: {
    borderWidth: 1.5,
  },
  proHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 14,
  },
  features: {
    gap: Spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  featureText: {
    flex: 1,
  },
});
