import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { RecordingCard } from '@/components/record/recording-card';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useRecordingSessionContext } from '@/features/audio/recording-provider';
import { createRecordedNoteInput } from '@/features/notes/repository';
import { useCreateNote } from '@/features/notes/use-notes';
import {
  useSuppressVaultLockOnFocus,
  useSuppressVaultLockWhile,
} from '@/features/security/use-vault-lock-suppression';

export default function RecordScreen() {
  const router = useRouter();
  const createNote = useCreateNote();
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

    await createNote.mutateAsync(
      createRecordedNoteInput(result.noteId, result.audioUri, result.durationMs),
    );
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
        durationMs={durationMillis}
        error={error}
        meteringSamples={meteringSamples}
        onOpenSettings={openMicrophoneSettings}
        onPause={pause}
        onRequestPermission={() => {
          void ensurePermissions();
        }}
        onResume={resume}
        onStart={() => {
          void start();
        }}
        onStop={() => {
          void handleStop();
        }}
        permissionBlocked={permissionBlocked}
        permissionDenied={permissionDenied}
        phase={phase}
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
