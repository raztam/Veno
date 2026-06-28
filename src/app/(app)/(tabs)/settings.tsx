import { StyleSheet, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { createTestNoteInput } from '@/features/notes/repository';
import { useCreateNote, useNotes } from '@/features/notes/use-notes';
import { WHISPER_MODEL_LABEL } from '@/features/transcription/constants';
import { isWhisperModelDownloaded } from '@/features/transcription/model-storage';
import { useTranscriptionStore } from '@/features/transcription/transcription-store';
import { isWhisperSupported } from '@/features/transcription/whisper-service';

export default function SettingsScreen() {
  const router = useRouter();
  const { data: notes } = useNotes();
  const createNote = useCreateNote();
  const modelStatus = useTranscriptionStore((state) => state.modelStatus);
  const modelProgress = useTranscriptionStore((state) => state.modelProgress);
  const whisperReady = isWhisperModelDownloaded();

  const modelStatusLabel = (() => {
    if (!isWhisperSupported()) {
      return 'Requires a native iOS or Android build.';
    }

    if (modelStatus === 'downloading') {
      return `Downloading ${WHISPER_MODEL_LABEL}… ${modelProgress}%`;
    }

    if (modelStatus === 'error') {
      return `${WHISPER_MODEL_LABEL} download failed. Retry by recording a note.`;
    }

    if (whisperReady || modelStatus === 'ready') {
      return `${WHISPER_MODEL_LABEL} ready for on-device transcription.`;
    }

    return `${WHISPER_MODEL_LABEL} (~466 MB) downloads on first transcription.`;
  })();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ThemedText style={styles.header} type="title">
          Settings
        </ThemedText>

        <Card style={styles.section}>
          <ThemedText type="subtitle">Vault</ThemedText>
          <ThemedText themeColor="textSecondary">
            Your notes and recordings stay on this device, protected by biometric lock.
          </ThemedText>
        </Card>

        <Card style={styles.section}>
          <ThemedText type="subtitle">Transcription</ThemedText>
          <ThemedText themeColor="textSecondary">{modelStatusLabel}</ThemedText>
        </Card>

        <Card style={styles.section}>
          <ThemedText type="subtitle">Developer</ThemedText>
          <ThemedText themeColor="textSecondary">
            {notes?.length ?? 0} note{notes?.length === 1 ? '' : 's'} stored locally.
          </ThemedText>
          <View style={styles.actions}>
            <Button
              label="View Debug Logs"
              onPress={() => router.push('/(app)/dev-logs' as Href)}
              variant="secondary"
            />
            <Button
              label="Add Test Note"
              loading={createNote.isPending}
              onPress={() => createNote.mutate(createTestNoteInput())}
              variant="secondary"
            />
          </View>
        </Card>

        <Card style={styles.section}>
          <ThemedText type="subtitle">Pro</ThemedText>
          <ThemedText themeColor="textSecondary">
            Unlimited recordings and smart summaries will be available with a Pro subscription in
            Stage 7.
          </ThemedText>
        </Card>

        <Card style={styles.section}>
          <ThemedText type="subtitle">About</ThemedText>
          <ThemedText themeColor="textSecondary">
            Veno — Speak it. We&apos;ll write it down, summarize it, and pull out your tasks.
          </ThemedText>
        </Card>
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
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  section: {
    gap: Spacing.sm,
  },
  actions: {
    marginTop: Spacing.xs,
  },
});
