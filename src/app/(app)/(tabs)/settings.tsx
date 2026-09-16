import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { TIER_LIMITS } from '@/constants/entitlements';
import { useIsPro } from '@/features/entitlements/entitlements-store';
import { formatAllowance } from '@/features/entitlements/gating';
import { isPurchasesSupported } from '@/features/entitlements/purchases-client';
import { useRestorePurchases } from '@/features/entitlements/use-pro-plan';
import { useRecordingAllowance } from '@/features/entitlements/use-usage';
import { useExportAllNotes } from '@/features/notes/use-export-notes';
import { useBiometricCapability } from '@/features/security/use-biometric-capability';
import { useSuppressVaultLockWhile } from '@/features/security/use-vault-lock-suppression';
import { useVaultLockPreference } from '@/features/security/use-vault-lock-preference';
import {
  downloadWhisperModelInBackground,
  isWhisperModelDownloadInProgress,
} from '@/features/models/background-whisper-download';
import {
  isSummarizeModelDownloadInProgress,
  requestSummarizeModelDownload,
} from '@/features/models/background-summarize-download';
import { useModelDownloadStore, useSummarizeModelProgress } from '@/features/models/model-download-store';
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
import { useTheme } from '@/hooks/use-theme';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isPro = useIsPro();
  const { remainingMs } = useRecordingAllowance();
  const restorePurchases = useRestorePurchases();
  const { exportAllNotes, isExporting } = useExportAllNotes();
  const { vaultLockEnabled, isUpdating, toggleVaultLock } = useVaultLockPreference();
  const { isAvailable: biometricsAvailable, guidance: biometricGuidance } = useBiometricCapability();
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  // Store sign-in sheets background the app — avoid relocking mid-restore.
  useSuppressVaultLockWhile(restorePurchases.isPending || isUpdating);
  const transcriptionModelStatus = useTranscriptionStore((state) => state.modelStatus);
  const transcriptionModelProgress = useTranscriptionStore((state) => state.modelProgress);
  const whisperDownloadStatus = useModelDownloadStore((state) => state.whisperStatus);
  const whisperDownloadProgress = useModelDownloadStore((state) => state.whisperProgress);
  const whisperDownloadError = useModelDownloadStore((state) => state.whisperError);
  const earStatus = useModelDownloadStore((state) => state.earStatus);
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

  const proStatusLabel = isPro
    ? 'Pro is active — unlimited recording, cloud backup, and export. Manage your subscription in your app store account settings.'
    : `Free tier: ${TIER_LIMITS.free.recordMinutesPerDay} minutes of recording per day with unlimited smart analysis. ${formatAllowance(remainingMs)} left today.`;

  const handleRestorePurchases = useCallback(() => {
    if (!isPurchasesSupported()) {
      setRestoreMessage('Purchases require a native iOS or Android build.');
      return;
    }

    setRestoreMessage(null);
    void restorePurchases.mutateAsync().then((outcome) => {
      if (outcome.status === 'restored') {
        setRestoreMessage('Pro restored. Welcome back!');
      } else if (outcome.status === 'not-entitled') {
        setRestoreMessage('No previous purchases found for this store account.');
      } else if (outcome.status === 'error') {
        setRestoreMessage(outcome.message ?? 'Could not restore purchases.');
      }
    });
  }, [restorePurchases]);

  const handleVaultLockToggle = useCallback(
    (nextValue: boolean) => {
      void toggleVaultLock(nextValue);
    },
    [toggleVaultLock],
  );

  const showWhisperDownloadButton = isWhisperSupported() && !whisperReady && !isWhisperDownloading;
  const showSummarizeDownloadButton =
    isSummarizeSupported() && !summarizeReady && !isSummarizeDownloading;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: BottomTabInset + insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.header} type="title">
            Settings
          </ThemedText>

          <Card style={styles.section}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleCopy}>
                <ThemedText type="subtitle">Require biometric lock</ThemedText>
                <ThemedText themeColor="textSecondary">
                  {vaultLockEnabled
                    ? 'Face ID, Touch ID, or your device passcode is required to open Veno.'
                    : 'The app opens directly to your notes without an unlock screen.'}
                </ThemedText>
                {biometricGuidance ? (
                  <ThemedText themeColor="textSecondary" type="small">
                    {biometricGuidance}
                  </ThemedText>
                ) : null}
              </View>
              <Switch
                accessibilityLabel="Require biometric lock"
                disabled={!biometricsAvailable || isUpdating}
                onValueChange={handleVaultLockToggle}
                thumbColor={theme.background}
                trackColor={{ false: theme.border, true: theme.tint }}
                value={vaultLockEnabled}
              />
            </View>
          </Card>

          <Card style={styles.section}>
            <ThemedText type="subtitle">Transcription</ThemedText>
            <ThemedText themeColor="textSecondary">{whisperStatusLabel}</ThemedText>
            {earStatus === 'ready' ? (
              <ThemedText themeColor="textSecondary" type="small">
                Spoken-language detector ready.
              </ThemedText>
            ) : null}
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
            <ThemedText type="subtitle">Pro</ThemedText>
            <ThemedText themeColor="textSecondary">{proStatusLabel}</ThemedText>
            {!isPro ? (
              <View style={styles.actions}>
                <Button
                  label="Upgrade to Pro"
                  onPress={() => router.push('/(app)/plan' as Href)}
                />
                <Button
                  label="Restore purchases"
                  loading={restorePurchases.isPending}
                  onPress={handleRestorePurchases}
                  variant="secondary"
                />
              </View>
            ) : (
              <View style={styles.actions}>
                <Button
                  label="Export all notes"
                  loading={isExporting}
                  onPress={exportAllNotes}
                  variant="secondary"
                />
              </View>
            )}
            {restoreMessage ? (
              <ThemedText themeColor="textSecondary" type="small">
                {restoreMessage}
              </ThemedText>
            ) : null}
          </Card>

          <Card style={styles.section}>
            <ThemedText type="subtitle">About</ThemedText>
            <ThemedText themeColor="textSecondary">
              Veno — Speak it. We&apos;ll write it down, summarize it, and pull out your tasks.
            </ThemedText>
          </Card>
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  section: {
    gap: Spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  toggleCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  actions: {
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
});
