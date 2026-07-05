import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { TIER_LIMITS } from '@/constants/entitlements';
import { formatTimeUntilReset } from '@/features/entitlements/gating';

type PaywallSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** True when the recorder auto-stopped mid-session at the cap. */
  autoStopped?: boolean;
};

export function PaywallSheet({ visible, onClose, autoStopped = false }: PaywallSheetProps) {
  const router = useRouter();
  const dailyMinutes = TIER_LIMITS.free.recordMinutesPerDay;

  const handleSeePlans = () => {
    onClose();
    router.push('/(app)/plan');
  };

  return (
    <Sheet onClose={onClose} title="Daily limit reached" visible={visible}>
      <ThemedText themeColor="textSecondary">
        {autoStopped
          ? `Your recording was saved, but you've used all ${dailyMinutes} minutes of today's free recording time.`
          : `You've used all ${dailyMinutes} minutes of today's free recording time.`}
      </ThemedText>
      <ThemedText themeColor="textSecondary">
        Your allowance resets in {formatTimeUntilReset()} — or go Pro for unlimited recording.
      </ThemedText>

      <View style={styles.actions}>
        <Button fullWidth label="See Pro plans" onPress={handleSeePlans} />
        <Button fullWidth label="Not now" onPress={onClose} variant="ghost" />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
});
