import { useRouter } from 'expo-router';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useSecurityStore } from '@/features/security/security-store';
import { useTheme } from '@/hooks/use-theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TAB_CONFIG = {
  index: {
    label: 'Notes',
    icon: { ios: 'doc.text' as const, android: 'description' as const, web: 'description' as const },
  },
  settings: {
    label: 'Settings',
    icon: { ios: 'gearshape' as const, android: 'settings' as const, web: 'settings' as const },
  },
};

export function AppTabBar({ state, navigation }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const tabs = state.routes.filter((route) => route.name in TAB_CONFIG);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          paddingBottom: Math.max(insets.bottom, Spacing.sm),
        },
      ]}>
      <View style={styles.tabsRow}>
        {tabs.map((route) => {
          const routeIndex = state.routes.findIndex((item) => item.key === route.key);
          const config = TAB_CONFIG[route.name as keyof typeof TAB_CONFIG];
          const isFocused = state.index === routeIndex;
          const color = isFocused ? theme.tint : theme.textSecondary;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tab}>
              <SymbolView
                fallback={<View style={[styles.iconFallback, { backgroundColor: color }]} />}
                name={config.icon}
                size={24}
                tintColor={color}
              />
              <ThemedText style={[styles.label, { color }]}>{config.label}</ThemedText>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityLabel="Record"
        accessibilityRole="button"
        onPress={() => {
          const { incrementVaultLockSuppression, decrementVaultLockSuppression } =
            useSecurityStore.getState();
          incrementVaultLockSuppression();
          router.push('/(app)/record');
          // Cover the sheet transition before the record screen mounts its own suppression.
          setTimeout(() => decrementVaultLockSuppression(), 2000);
        }}
        style={styles.recordButton}>
        <View style={[styles.recordInner, { backgroundColor: theme.tint }]}>
          <SymbolView
            fallback={<View style={styles.recordFallback} />}
            name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }}
            size={28}
            tintColor="#FFFFFF"
          />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.sm,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
  iconFallback: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    opacity: 0.6,
  },
  recordButton: {
    position: 'absolute',
    alignSelf: 'center',
    top: -Spacing.lg,
  },
  recordInner: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  recordFallback: {
    width: 20,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
  },
});
