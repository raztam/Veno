import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const backgroundColor = (() => {
    if (isDisabled) return theme.backgroundSelected;
    switch (variant) {
      case 'primary':
        return theme.tint;
      case 'secondary':
        return theme.backgroundElement;
      case 'ghost':
        return 'transparent';
      case 'destructive':
        return theme.error;
    }
  })();

  const textColor = (() => {
    if (isDisabled) return theme.textSecondary;
    switch (variant) {
      case 'primary':
      case 'destructive':
        return '#FFFFFF';
      case 'secondary':
      case 'ghost':
        return theme.text;
    }
  })();

  const borderColor =
    variant === 'ghost' || variant === 'secondary' ? theme.border : 'transparent';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        {
          backgroundColor,
          borderColor,
          opacity: pressed && !isDisabled ? 0.85 : 1,
        },
        fullWidth && styles.fullWidth,
        style as StyleProp<ViewStyle>,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <ThemedText
          style={[styles.label, sizeLabelStyles[size], { color: textColor }]}
          numberOfLines={1}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  label: {
    fontWeight: '600',
  },
});

const sizeStyles = StyleSheet.create({
  sm: {
    minHeight: 36,
    paddingHorizontal: Spacing.md,
  },
  md: {
    minHeight: 48,
    paddingHorizontal: Spacing.lg,
  },
  lg: {
    minHeight: 56,
    paddingHorizontal: Spacing.xl,
  },
});

const sizeLabelStyles = StyleSheet.create({
  sm: {
    fontSize: 14,
    lineHeight: 18,
  },
  md: {
    fontSize: 16,
    lineHeight: 21,
  },
  lg: {
    fontSize: 17,
    lineHeight: 22,
  },
});
