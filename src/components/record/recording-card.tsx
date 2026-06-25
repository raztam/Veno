import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { RecordingPhase } from '@/features/audio/use-recording-session';
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
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRequestPermission: () => void;
  onOpenSettings: () => void;
};

export function RecordingCard({
  phase,
  durationMs,
  meteringSamples,
  permissionDenied,
  permissionBlocked,
  error,
  onStart,
  onPause,
  onResume,
  onStop,
  onRequestPermission,
  onOpenSettings,
}: RecordingCardProps) {
  const theme = useTheme();
  const isActive = phase === 'recording' || phase === 'paused';

  return (
    <Card style={styles.card} variant="filled">
      <View style={[styles.micBadge, { backgroundColor: theme.background }]}>
        <ThemedText type="subtitle">{isActive ? '●' : '🎙'}</ThemedText>
      </View>

      <RecordingTimer durationMs={durationMs} phase={phase} />

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
