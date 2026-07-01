import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import {
  downloadWhisperModelInBackground,
  isWhisperModelDownloadInProgress,
} from '@/features/models/background-whisper-download';
import {
  isSummarizeModelDownloadInProgress,
  requestSummarizeModelDownload,
} from '@/features/models/background-summarize-download';
import { useModelDownloadStore, useSummarizeModelProgress } from '@/features/models/model-download-store';
import { createTestNoteInput } from '@/features/notes/repository';
import { useCreateNote, useNotes } from '@/features/notes/use-notes';
import {
  SUMMARIZE_MODEL_LABEL,
  SUMMARIZE_MODEL_SIZE_HINT,
} from '@/features/summarize/constants';
import { isSummarizeModelDownloaded } from '@/features/summarize/summarize-model-storage';
import { isSummarizeSupported } from '@/features/summarize/support';
import { WHISPER_MODEL_LABEL } from '@/features/transcription/constants';
import { isWhisperModelDownloaded } from '@/features/transcription/model-storage';
import { useTranscriptionStore } from '@/features/transcription/transcription-store';
import { isWhisperSupported } from '@/features/transcription/whisper-service';

export default function SettingsScreen() {
  const router = useRouter();
  const { data: notes } = useNotes();
  const createNote = useCreateNote();
  const transcriptionModelStatus = useTranscriptionStore((state) => state.modelStatus);
  const transcriptionModelProgress = useTranscriptionStore((state) => state.modelProgress);
  const whisperDownloadStatus = useModelDownloadStore((state) => state.whisperStatus);
  const whisperDownloadProgress = useModelDownloadStore((state) => state.whisperProgress);
  const whisperDownloadError = useModelDownloadStore((state) => state.whisperError);
  const summarizeDownloadStatus = useModelDownloadStore((state) => state.summarizeStatus);
  const summarizeDownloadProgress = useModelDownloadStore((state) => state.summarizeProgress);
  const summarizeDownloadError = useModelDownloadStore((state) => state.summarizeError);
  const setModelStatus = useTranscriptionStore((state) => state.setModelStatus);
  const setModelProgress = useTranscriptionStore((state) => state.setModelProgress);
  const whisperReady = isWhisperModelDownloaded();
  const summarizeReady = isSummarizeModelDownloaded();
  const isWhisperDownloading =
    isWhisperModelDownloadInProgress() ||
    whisperDownloadStatus === 'downloading' ||
    transcriptionModelStatus === 'downloading';
  const whisperProgress = Math.max(whisperDownloadProgress, transcriptionModelProgress);
  const { status: summarizeModelStatus, downloadProgress: summarizeDownloadProgressFraction } =
    useSummarizeModelProgress();
  const isSummarizeDownloading =
    isSummarizeModelDownloadInProgress() || summarizeDownloadStatus === 'downloading';
  const summarizeProgress = Math.max(summarizeDownloadProgress, summarizeDownloadProgressFraction * 100);

  const handleDownloadSummarizeModel = useCallback(() => {
    void requestSummarizeModelDownload();
  }, []);

  const handleDownloadWhisperModel = useCallback(() => {
    setModelStatus('downloading');
    setModelProgress(0);

    void downloadWhisperModelInBackground((progress) => {
      setModelProgress(progress);
    })
      .then(() => {
        setModelStatus('ready');
        setModelProgress(100);
      })
      .catch(() => {
        setModelStatus('error');
      });
  }, [setModelProgress, setModelStatus]);

  const whisperStatusLabel = (() => {
    if (!isWhisperSupported()) {
      return 'Requires a native iOS or Android build.';
    }

    if (isWhisperDownloading) {
      return `Downloading ${WHISPER_MODEL_LABEL}… ${whisperProgress}%`;
    }

    if (whisperDownloadStatus === 'error' || transcriptionModelStatus === 'error') {
      return whisperDownloadError ?? `${WHISPER_MODEL_LABEL} download failed. Tap download to retry.`;
    }

    if (whisperReady || whisperDownloadStatus === 'ready' || transcriptionModelStatus === 'ready') {
      return `${WHISPER_MODEL_LABEL} ready for on-device transcription.`;
    }

    return `${WHISPER_MODEL_LABEL} (~466 MB) downloads in the background. You can lock your screen or switch apps.`;
  })();

  const summarizeStatusLabel = (() => {
    if (!isSummarizeSupported()) {
      return 'Requires a native iOS or Android build.';
    }

    if (isSummarizeDownloading) {
      return `Downloading ${SUMMARIZE_MODEL_LABEL}… ${Math.round(summarizeProgress)}%`;
    }

    if (summarizeDownloadStatus === 'error' || summarizeModelStatus === 'error') {
      return summarizeDownloadError ?? `${SUMMARIZE_MODEL_LABEL} download failed. Tap download to retry.`;
    }

    if (summarizeReady || summarizeDownloadStatus === 'ready' || summarizeModelStatus === 'ready') {
      return `${SUMMARIZE_MODEL_LABEL} ready for on-device summaries and task extraction.`;
    }

    return `${SUMMARIZE_MODEL_LABEL} (${SUMMARIZE_MODEL_SIZE_HINT}) downloads in the background. You can lock your screen or switch apps.`;
  })();

  const showWhisperDownloadButton = isWhisperSupported() && !whisperReady && !isWhisperDownloading;
  const showSummarizeDownloadButton =
    isSummarizeSupported() && !summarizeReady && !isSummarizeDownloading;

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
          <ThemedText themeColor="textSecondary">{whisperStatusLabel}</ThemedText>
          {showWhisperDownloadButton ? (
            <View style={styles.actions}>
              <Button
                label="Download voice model"
                onPress={handleDownloadWhisperModel}
                variant="secondary"
              />
            </View>
          ) : null}
        </Card>

        <Card style={styles.section}>
          <ThemedText type="subtitle">Summarization</ThemedText>
          <ThemedText themeColor="textSecondary">{summarizeStatusLabel}</ThemedText>
          {showSummarizeDownloadButton ? (
            <View style={styles.actions}>
              <Button
                label="Download summary model"
                onPress={handleDownloadSummarizeModel}
                variant="secondary"
              />
            </View>
          ) : null}
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
