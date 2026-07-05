import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PricingCard } from '@/components/plan/pricing-card';
import { TierComparison } from '@/components/plan/tier-comparison';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useIsPro } from '@/features/entitlements/entitlements-store';
import { isPurchasesSupported } from '@/features/entitlements/purchases-client';
import { useProPlan, usePurchasePro, useRestorePurchases } from '@/features/entitlements/use-pro-plan';
import { useSuppressVaultLockWhile } from '@/features/security/use-vault-lock-suppression';

export default function PlanScreen() {
  const router = useRouter();
  const isPro = useIsPro();
  const proPlan = useProPlan();
  const purchase = usePurchasePro();
  const restore = useRestorePurchases();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const supported = isPurchasesSupported();

  // The native store payment sheet backgrounds the app — don't relock the
  // vault while a purchase or restore is in flight.
  useSuppressVaultLockWhile(purchase.isPending || restore.isPending);

  const handlePurchase = async () => {
    setStatusMessage(null);
    const outcome = await purchase.mutateAsync();

    if (outcome.status === 'purchased') {
      router.back();
      return;
    }

    if (outcome.status === 'error') {
      setStatusMessage(outcome.message ?? 'Purchase failed. Please try again.');
    } else if (outcome.status === 'not-entitled') {
      setStatusMessage('Purchase completed but Pro is not active yet. Try restoring purchases.');
    }
  };

  const handleRestore = async () => {
    setStatusMessage(null);
    const outcome = await restore.mutateAsync();

    if (outcome.status === 'restored') {
      setStatusMessage('Pro restored. Welcome back!');
    } else if (outcome.status === 'not-entitled') {
      setStatusMessage('No previous purchases found for this store account.');
    } else if (outcome.status === 'error') {
      setStatusMessage(outcome.message ?? 'Could not restore purchases.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Veno Pro</ThemedText>
          <Button label="Close" onPress={() => router.back()} size="sm" variant="ghost" />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.hero} type="title">
            Record without limits
          </ThemedText>
          <ThemedText style={styles.heroSubtitle} themeColor="textSecondary">
            Unlimited recording time, encrypted cloud backup, and export — everything still private
            and on-device.
          </ThemedText>

          <TierComparison />

          {isPro ? (
            <Card style={styles.proActiveCard} variant="filled">
              <ThemedText type="subtitle">You&apos;re Pro ✓</ThemedText>
              <ThemedText style={styles.centeredText} themeColor="textSecondary" type="small">
                Unlimited recording is active on this device. Manage or cancel your subscription in
                your app store account settings.
              </ThemedText>
            </Card>
          ) : (
            <PricingCard
              isLoading={proPlan.isLoading}
              loadFailed={proPlan.isError}
              onPurchase={() => {
                void handlePurchase();
              }}
              plan={proPlan.data}
              purchasing={purchase.isPending}
              supported={supported}
            />
          )}

          {statusMessage ? (
            <ThemedText style={styles.centeredText} themeColor="textSecondary" type="small">
              {statusMessage}
            </ThemedText>
          ) : null}

          {supported && !isPro ? (
            <Button
              fullWidth
              label="Restore purchases"
              loading={restore.isPending}
              onPress={() => {
                void handleRestore();
              }}
              variant="ghost"
            />
          ) : null}

          <ThemedText style={styles.footnote} themeColor="textSecondary" type="small">
            Payment is handled by the App Store / Google Play. The free tier stays free — 5 minutes
            of recording per day with unlimited smart analysis.
          </ThemedText>
        </ScrollView>
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
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  hero: {
    paddingTop: Spacing.md,
  },
  heroSubtitle: {
    paddingBottom: Spacing.sm,
  },
  proActiveCard: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  centeredText: {
    textAlign: 'center',
  },
  footnote: {
    textAlign: 'center',
    paddingTop: Spacing.sm,
  },
});
