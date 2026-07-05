import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PaywallSheet } from '@/components/paywall/paywall-sheet';
import { RecordingCard } from '@/components/record/recording-card';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useRecordingSessionContext } from '@/features/audio/recording-provider';
import type { StopResult } from '@/features/audio/use-recording-session';
import { useAddRecordedMs, useRecordingAllowance } from '@/features/entitlements/use-usage';
import { createRecordedNoteInput } from '@/features/notes/repository';
import { useCreateNote } from '@/features/notes/use-notes';
import {
  useSuppressVaultLockOnFocus,
  useSuppressVaultLockWhile,
} from '@/features/security/use-vault-lock-suppression';

export default function RecordScreen() {
  const router = useRouter();
  const createNote = useCreateNote();
  const addRecordedMs = useAddRecordedMs();
  const { isPro, remainingMs, canStart } = useRecordingAllowance();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [autoStopped, setAutoStopped] = useState(false);
  // Allowance snapshot taken when the session starts, so the live countdown
  // doesn't jump if the usage query refreshes mid-recording.
  const remainingAtStartRef = useRef<number>(Infinity);

  const {
    phase,
    permissionDenied,
    permissionBlocked,
    error,
    durationMillis,
    meteringSamples,
    start,
    pause,
    resume,
    stopAndSave,
    ensurePermissions,
    openMicrophoneSettings,
    reset,
  } = useRecordingSessionContext();

  useSuppressVaultLockOnFocus();
  useSuppressVaultLockWhile(phase === 'recording' || phase === 'paused' || phase === 'saving');

  const isSessionActive = phase !== 'idle';
  const remainingDailyMs = isPro
    ? null
    : Math.max(0, (isSessionActive ? remainingAtStartRef.current : remainingMs) - durationMillis);

  const persistResult = async (result: StopResult) => {
    if (!isPro) {
      await addRecordedMs.mutateAsync(result.durationMs);
    }
    await createNote.mutateAsync(
      createRecordedNoteInput(result.noteId, result.audioUri, result.durationMs),
    );
  };

  const handleStart = () => {
    if (!canStart) {
      setAutoStopped(false);
      setPaywallVisible(true);
      return;
    }

    remainingAtStartRef.current = isPro ? Infinity : remainingMs;
    setAutoStopped(false);
    void start({
      maxDurationMs: isPro ? undefined : remainingMs,
      onLimitReached: (result) => {
        void (async () => {
          if (result) {
            await persistResult(result);
          }
          setAutoStopped(true);
          setPaywallVisible(true);
        })();
      },
    });
  };

  const handleClose = async () => {
    if (phase === 'recording' || phase === 'paused') {
      await reset();
    }
    router.back();
  };

  const handleStop = async () => {
    const result = await stopAndSave();
    if (!result) {
      return;
    }

    await persistResult(result);
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle">Record</ThemedText>
        <Button
          disabled={phase === 'saving'}
          label="Close"
          onPress={handleClose}
          size="sm"
          variant="ghost"
        />
      </View>

      <RecordingCard
        allowanceExhausted={!canStart && phase === 'idle'}
        durationMs={durationMillis}
        error={error}
        meteringSamples={meteringSamples}
        onOpenSettings={openMicrophoneSettings}
        onPause={pause}
        onRequestPermission={() => {
          void ensurePermissions();
        }}
        onResume={resume}
        onSeePlans={() => {
          router.push('/(app)/plan');
        }}
        onStart={handleStart}
        onStop={() => {
          void handleStop();
        }}
        permissionBlocked={permissionBlocked}
        permissionDenied={permissionDenied}
        phase={phase}
        remainingDailyMs={remainingDailyMs}
      />

      <PaywallSheet
        autoStopped={autoStopped}
        onClose={() => setPaywallVisible(false)}
        visible={paywallVisible}
      />
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
});
