import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type LanguageBadgeProps = {
  label: string;
};

export function LanguageBadge({ label }: LanguageBadgeProps) {
  const theme = useTheme();

  return (
    <View style={[styles.badge, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText style={styles.label} themeColor="textSecondary" type="small">
        Transcribed in {label}
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
