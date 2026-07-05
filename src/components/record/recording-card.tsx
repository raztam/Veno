import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { RecordingPhase } from '@/features/audio/use-recording-session';
import { formatAllowance } from '@/features/entitlements/gating';
import { useTheme } from '@/hooks/use-theme';

import { RecordingTimer } from './recording-timer';
import { RecordingWaveform } from './recording-waveform';

type RecordingCardProps = {
  phase: RecordingPhase;
  durationMs: number;
  meteringSamples: number[];
  permissionDenied: boolean;
  permissionBlocked: boolean;
  error: string | null;
  /** Remaining daily allowance countdown in ms. `null` hides it (Pro). */
  remainingDailyMs?: number | null;
  /** Daily cap already used up — block start and point at the paywall. */
  allowanceExhausted?: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRequestPermission: () => void;
  onOpenSettings: () => void;
  onSeePlans?: () => void;
};

export function RecordingCard({
  phase,
  durationMs,
  meteringSamples,
  permissionDenied,
  permissionBlocked,
  error,
  remainingDailyMs = null,
  allowanceExhausted = false,
  onStart,
  onPause,
  onResume,
  onStop,
  onRequestPermission,
  onOpenSettings,
  onSeePlans,
}: RecordingCardProps) {
  const theme = useTheme();
  const isActive = phase === 'recording' || phase === 'paused';
  const showAllowance = remainingDailyMs !== null && !permissionDenied && !allowanceExhausted;
  const allowanceLow = remainingDailyMs !== null && remainingDailyMs <= 60_000;

  return (
    <Card style={styles.card} variant="filled">
      <View style={[styles.micBadge, { backgroundColor: theme.background }]}>
        <ThemedText type="subtitle">{isActive ? '●' : '🎙'}</ThemedText>
      </View>

      <RecordingTimer durationMs={durationMs} phase={phase} />

      {showAllowance ? (
        <ThemedText
          style={[styles.allowance, allowanceLow && { color: theme.error }]}
          themeColor="textSecondary"
          type="smallBold">
          {formatAllowance(remainingDailyMs)} left today
        </ThemedText>
      ) : null}

      <RecordingWaveform
        color={phase === 'paused' ? theme.textSecondary : theme.tint}
        samples={isActive ? meteringSamples : []}
      />

      {permissionDenied ? (
        <ThemedText style={styles.message} themeColor="textSecondary">
          {permissionBlocked
            ? 'Microphone access is blocked. Open Settings to allow Veno to record voice notes.'
            : 'Microphone access is required to record voice notes.'}
        </ThemedText>
      ) : allowanceExhausted ? (
        <ThemedText style={styles.message} themeColor="textSecondary">
          You&apos;ve used today&apos;s free recording time. Upgrade to Pro for unlimited
          recording, or come back after midnight.
        </ThemedText>
      ) : (
        <ThemedText style={styles.message} themeColor="textSecondary">
          {phase === 'idle'
            ? 'Tap record and speak naturally. Pause anytime, then stop to save.'
            : phase === 'paused'
              ? 'Recording paused. Resume or stop to save your note.'
              : phase === 'saving'
                ? 'Saving your recording locally…'
                : 'Listening… tap pause or stop when you are done.'}
        </ThemedText>
      )}

      {error ? (
        <ThemedText style={styles.error} themeColor="error">
          {error}
        </ThemedText>
      ) : null}

      <View style={styles.actions}>
        {permissionDenied ? (
          permissionBlocked ? (
            <Button fullWidth label="Open Settings" onPress={onOpenSettings} />
          ) : (
            <Button fullWidth label="Enable Microphone" onPress={onRequestPermission} />
          )
        ) : allowanceExhausted && phase === 'idle' ? (
          <Button fullWidth label="See Pro Plans" onPress={onSeePlans ?? onStart} />
        ) : phase === 'idle' ? (
          <Button fullWidth label="Start Recording" onPress={onStart} />
        ) : phase === 'recording' ? (
          <View style={styles.row}>
            <Button label="Pause" onPress={onPause} style={styles.flex} variant="secondary" />
            <Button label="Stop & Save" onPress={onStop} style={styles.flex} />
          </View>
        ) : phase === 'paused' ? (
          <View style={styles.row}>
            <Button label="Resume" onPress={onResume} style={styles.flex} />
            <Button label="Stop & Save" onPress={onStop} style={styles.flex} variant="secondary" />
          </View>
        ) : (
          <Button disabled fullWidth label="Saving…" loading />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.lg,
  },
  micBadge: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
  },
  allowance: {
    textAlign: 'center',
    marginTop: -Spacing.sm,
  },
  error: {
    textAlign: 'center',
  },
  actions: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  flex: {
    flex: 1,
  },
});
