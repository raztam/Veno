import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View, type ModalProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SheetProps = Pick<ModalProps, 'visible' | 'onRequestClose'> & {
  title?: string;
  children: ReactNode;
  onClose: () => void;
};

export function Sheet({ visible, title, children, onClose, onRequestClose }: SheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="slide"
      onRequestClose={onRequestClose ?? onClose}
      transparent
      visible={visible}>
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.backdrop} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.background,
              paddingBottom: Math.max(insets.bottom, Spacing.md),
            },
          ]}>
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          {title ? (
            <ThemedText style={styles.title} type="subtitle">
              {title}
            </ThemedText>
          ) : null}
          <View style={styles.content}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.md,
  },
  content: {
    gap: Spacing.md,
  },
});
