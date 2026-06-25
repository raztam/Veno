import { StyleSheet, View, type ViewProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

import { Button, type ButtonProps } from './button';

export type EmptyStateProps = ViewProps & {
  title: string;
  description?: string;
  action?: Pick<ButtonProps, 'label' | 'onPress' | 'variant'>;
};

export function EmptyState({ title, description, action, style, ...rest }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]} {...rest}>
      <View style={styles.textGroup}>
        <ThemedText style={styles.title} type="subtitle">
          {title}
        </ThemedText>
        {description ? (
          <ThemedText style={styles.description} themeColor="textSecondary">
            {description}
          </ThemedText>
        ) : null}
      </View>
      {action ? (
        <Button
          label={action.label}
          onPress={action.onPress}
          variant={action.variant ?? 'primary'}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  textGroup: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    maxWidth: 280,
  },
});
