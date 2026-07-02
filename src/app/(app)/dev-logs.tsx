import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import {
  clearDevLogFile,
  formatDevLogsForExport,
  getDevLogFileUri,
  type DevLogEntry,
} from '@/features/telemetry/dev-logger';
import { useDevLogs } from '@/features/telemetry/use-dev-logs';
import { useTheme } from '@/hooks/use-theme';

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function LogRow({ entry }: { entry: DevLogEntry }) {
  const theme = useTheme();

  const levelColor = (() => {
    switch (entry.level) {
      case 'error':
        return theme.error;
      case 'warn':
        return '#D97706';
      case 'info':
        return theme.tint;
      default:
        return theme.textSecondary;
    }
  })();

  return (
    <View style={[styles.logRow, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
      <ThemedText style={[styles.logMeta, { color: levelColor }]} type="small">
        {formatTime(entry.timestamp)} [{entry.level}] {entry.tag}
      </ThemedText>
      <ThemedText style={styles.logMessage}>{entry.message}</ThemedText>
      {entry.details ? (
        <ThemedText selectable style={styles.logDetails} themeColor="textSecondary" type="small">
          {entry.details}
        </ThemedText>
      ) : null}
    </View>
  );
}

export default function DevLogsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { entries, clear } = useDevLogs();

  const header = useMemo(() => {
    const appVersion = Constants.expoConfig?.version ?? 'unknown';
    const deviceName = Device.modelName ?? 'Unknown device';
    const osName = Device.osName ?? 'Unknown OS';
    const osVersion = Device.osVersion ?? '?';

    return `Veno ${appVersion}\n${deviceName} · ${osName} ${osVersion}`;
  }, []);

  const handleShare = async () => {
    const logFileUri = getDevLogFileUri();
    const body = `${header}\n\n${formatDevLogsForExport(entries)}${
      logFileUri ? `\n\nLog file: ${logFileUri}` : ''
    }`;

    await Share.share({ message: body, title: 'Veno debug logs' });
  };

  const handleClear = () => {
    clear();
    clearDevLogFile();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <ThemedText type="title">Debug Logs</ThemedText>
          <Button label="Close" onPress={() => router.back()} size="sm" variant="ghost" />
        </View>

        <ThemedText style={styles.subheader} themeColor="textSecondary" type="small">
          {header}
        </ThemedText>
        <ThemedText style={styles.hint} themeColor="textSecondary" type="small">
          Capture logs on-device for release builds. Share them after reproducing an issue, or run
          `npm run logs:android` while the phone is connected over USB.
        </ThemedText>

        <View style={styles.actions}>
          <Button label="Share Logs" onPress={() => void handleShare()} size="sm" />
          <Button label="Clear" onPress={handleClear} size="sm" variant="secondary" />
        </View>

        <FlatList
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          data={[...entries].reverse()}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={[styles.empty, { borderColor: theme.border }]}>
              <ThemedText themeColor="textSecondary">No logs yet.</ThemedText>
            </View>
          }
          renderItem={({ item }) => <LogRow entry={item} />}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
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
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  subheader: {
    marginBottom: Spacing.xs,
  },
  hint: {
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  logRow: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  logMeta: {
    fontFamily: 'monospace',
  },
  logMessage: {
    lineHeight: 20,
  },
  logDetails: {
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  empty: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
});
