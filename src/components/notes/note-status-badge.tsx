import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { NoteStatus } from '@/db/schema';
import { useTheme } from '@/hooks/use-theme';

const statusLabels: Record<NoteStatus, string> = {
  recorded: 'Recorded',
  transcribing: 'Transcribing',
  summarizing: 'Summarizing',
  ready: 'Ready',
  error: 'Error',
};

type NoteStatusBadgeProps = {
  status: NoteStatus;
  detail?: string | null;
};

export function NoteStatusBadge({ status, detail }: NoteStatusBadgeProps) {
  const theme = useTheme();

  return (
    <View style={[styles.badge, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText style={styles.label} themeColor="textSecondary" type="small">
        {statusLabels[status]}
        {detail ?? ''}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
  },
});
