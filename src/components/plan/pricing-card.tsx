import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { ProPlan } from '@/features/entitlements/purchases-types';
import { useTheme } from '@/hooks/use-theme';

type PricingCardProps = {
  plan: ProPlan | null | undefined;
  isLoading: boolean;
  loadFailed: boolean;
  purchasing: boolean;
  supported: boolean;
  onPurchase: () => void;
};

export function PricingCard({
  plan,
  isLoading,
  loadFailed,
  purchasing,
  supported,
  onPurchase,
}: PricingCardProps) {
  const theme = useTheme();

  if (!supported) {
    return (
      <Card style={styles.card} variant="filled">
        <ThemedText style={styles.centered} themeColor="textSecondary">
          Purchases are available in the iOS and Android apps.
        </ThemedText>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card style={styles.card} variant="filled">
        <ActivityIndicator />
        <ThemedText style={styles.centered} themeColor="textSecondary" type="small">
          Loading plans…
        </ThemedText>
      </Card>
    );
  }

  if (loadFailed || !plan) {
    return (
      <Card style={styles.card} variant="filled">
        <ThemedText style={styles.centered} themeColor="textSecondary">
          Plans are unavailable right now. Please try again later.
        </ThemedText>
      </Card>
    );
  }

  return (
    <Card style={styles.card} variant="filled">
      {plan.trialLabel ? (
        <View style={[styles.trialBadge, { backgroundColor: theme.tint }]}>
          <ThemedText style={styles.trialText} type="smallBold">
            {plan.trialLabel.toUpperCase()}
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.priceRow}>
        <ThemedText type="title">{plan.priceString}</ThemedText>
        <ThemedText themeColor="textSecondary">/ {plan.periodLabel}</ThemedText>
      </View>

      <ThemedText style={styles.centered} themeColor="textSecondary" type="small">
        {plan.trialLabel
          ? `Start your ${plan.trialLabel}, then ${plan.priceString}/${plan.periodLabel}. Cancel anytime.`
          : `Billed ${plan.priceString} per ${plan.periodLabel} through your app store. Cancel anytime.`}
      </ThemedText>

      <Button
        fullWidth
        label={plan.trialLabel ? 'Start free trial' : 'Subscribe'}
        loading={purchasing}
        onPress={onPurchase}
        size="lg"
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  centered: {
    textAlign: 'center',
  },
  trialBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  trialText: {
    color: '#FFFFFF',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
});
