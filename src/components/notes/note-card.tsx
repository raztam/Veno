import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Note, NoteStatus } from '@/db/schema';
import { formatDetectedLanguage } from '@/features/transcription/format-language';
import { useNoteTranscriptionProgress } from '@/features/transcription/transcription-store';
import { useNoteSummarizeTokenCount, useSummarizeModelProgress } from '@/features/summarize/summarize-store';
import { useTheme } from '@/hooks/use-theme';

type NoteCardProps = {
  note: Note;
  onPress: () => void;
};

const statusLabels: Record<NoteStatus, string> = {
  recorded: 'Recorded',
  transcribing: 'Transcribing',
  summarizing: 'Summarizing',
  ready: 'Ready',
  error: 'Error',
};

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function NoteCard({ note, onPress }: NoteCardProps) {
  const theme = useTheme();
  const progress = useNoteTranscriptionProgress(note.id);
  const summarizeTokens = useNoteSummarizeTokenCount(note.id);
  const { status: modelStatus, downloadProgress } = useSummarizeModelProgress();
  const languageLabel = formatDetectedLanguage(note.detectedLanguage);

  const previewText = (() => {
    if (note.status === 'transcribing') {
      return progress != null ? `Transcribing… ${progress}%` : 'Transcribing…';
    }

    if (note.status === 'summarizing') {
      if (modelStatus === 'downloading') {
        return `Downloading AI model… ${Math.round(downloadProgress * 100)}%`;
      }

      if (summarizeTokens != null && summarizeTokens > 0) {
        return `Summarizing… ${summarizeTokens} tokens`;
      }

      return 'Summarizing on-device…';
    }

    if (note.status === 'error') {
      return note.transcript || 'Processing failed.';
    }

    if (note.summary) {
      return note.summary.replace(/^[-*]\s*/gm, '').split('\n')[0] ?? note.summary;
    }

    if (note.transcript) {
      return note.transcript;
    }

    if (note.status === 'recorded') {
      return 'Waiting to transcribe…';
    }

    return 'No transcript yet.';
  })();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <ThemedText numberOfLines={1} style={styles.title} type="subtitle">
            {note.title}
          </ThemedText>
          <View style={[styles.badge, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText style={styles.badgeText} themeColor="textSecondary" type="small">
              {statusLabels[note.status]}
            </ThemedText>
          </View>
        </View>
        <ThemedText numberOfLines={2} themeColor="textSecondary">
          {previewText}
        </ThemedText>
        {languageLabel ? (
          <ThemedText themeColor="textSecondary" type="small">
            Transcribed in {languageLabel}
          </ThemedText>
        ) : null}
        <View style={styles.meta}>
          <ThemedText themeColor="textSecondary" type="small">
            {formatDate(note.createdAt)}
          </ThemedText>
          <ThemedText themeColor="textSecondary" type="small">
            {formatDuration(note.durationMs)}
          </ThemedText>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 14,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
});
