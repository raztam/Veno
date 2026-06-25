import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Typography } from '@/constants/theme';
import type { RecordingPhase } from '@/features/audio/use-recording-session';
import { formatRecordingTimer } from '@/features/audio/recording-options';

type RecordingTimerProps = {
  durationMs: number;
  phase: RecordingPhase;
};

const phaseLabels: Record<RecordingPhase, string> = {
  idle: 'Ready',
  recording: 'Recording',
  paused: 'Paused',
  saving: 'Saving',
};

export function RecordingTimer({ durationMs, phase }: RecordingTimerProps) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.timer}>{formatRecordingTimer(durationMs)}</ThemedText>
      <ThemedText themeColor="textSecondary" type="small">
        {phaseLabels[phase]}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timer: {
    ...Typography.title1,
    fontVariant: ['tabular-nums'],
  },
});
