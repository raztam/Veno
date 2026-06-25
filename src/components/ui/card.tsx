import { StyleSheet, View, type ViewProps } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardVariant = 'elevated' | 'outlined' | 'filled';

export type CardProps = ViewProps & {
  variant?: CardVariant;
  padded?: boolean;
};

export function Card({
  variant = 'elevated',
  padded = true,
  style,
  children,
  ...rest
}: CardProps) {
  const theme = useTheme();

  const backgroundColor =
    variant === 'filled' ? theme.backgroundElement : theme.background;

  return (
    <View
      style={[
        styles.base,
        padded && styles.padded,
        {
          backgroundColor,
          borderColor: variant === 'outlined' ? theme.border : 'transparent',
          borderWidth: variant === 'outlined' ? StyleSheet.hairlineWidth : 0,
        },
        variant === 'elevated' && styles.elevated,
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  padded: {
    padding: Spacing.md,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
});
