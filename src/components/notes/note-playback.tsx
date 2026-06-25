import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { formatRecordingTimer } from '@/features/audio/recording-options';
import { useNotePlayback } from '@/features/audio/use-note-playback';
import { useTheme } from '@/hooks/use-theme';

type NotePlaybackProps = {
  audioUri: string;
  durationMs: number;
};

export function NotePlayback({ audioUri, durationMs }: NotePlaybackProps) {
  const theme = useTheme();
  const { isPlaying, isLoading, error, currentTimeMs, durationMs: playbackDurationMs, progress, togglePlay, seekToProgress } =
    useNotePlayback({ audioUri, fallbackDurationMs: durationMs });
  const [trackWidth, setTrackWidth] = useState(0);

  const handleSeek = (locationX: number) => {
    if (trackWidth <= 0) {
      return;
    }

    void seekToProgress(locationX / trackWidth);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundElement }]}>
      <Pressable
        accessibilityLabel={isPlaying ? 'Pause recording' : 'Play recording'}
        accessibilityRole="button"
        disabled={isLoading || Boolean(error)}
        onPress={() => void togglePlay()}
        style={({ pressed }) => [
          styles.playButton,
          { backgroundColor: theme.tint, opacity: pressed ? 0.85 : 1 },
        ]}>
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <SymbolView
            name={{ ios: isPlaying ? 'pause.fill' : 'play.fill', android: isPlaying ? 'pause' : 'play_arrow', web: isPlaying ? 'pause' : 'play_arrow' }}
            size={22}
            tintColor="#FFFFFF"
          />
        )}
      </Pressable>

      <View style={styles.controls}>
        <View
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
          style={styles.track}>
          <Pressable
            accessibilityLabel="Seek playback"
            accessibilityRole="adjustable"
            onPress={(event) => handleSeek(event.nativeEvent.locationX)}
            style={styles.trackPressable}>
            <View style={[styles.trackBackground, { backgroundColor: theme.backgroundSelected }]}>
              <View style={[styles.trackFill, { backgroundColor: theme.tint, width: `${progress * 100}%` }]} />
            </View>
          </Pressable>
        </View>

        <View style={styles.timestamps}>
          <ThemedText style={styles.time} themeColor="textSecondary" type="small">
            {formatRecordingTimer(currentTimeMs)}
          </ThemedText>
          <ThemedText style={styles.time} themeColor="textSecondary" type="small">
            {formatRecordingTimer(playbackDurationMs)}
          </ThemedText>
        </View>

        {error ? (
          <ThemedText themeColor="error" type="small">
            Could not play this recording.
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    flex: 1,
    gap: Spacing.xs,
  },
  track: {
    width: '100%',
  },
  trackPressable: {
    paddingVertical: Spacing.xs,
  },
  trackBackground: {
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  timestamps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    ...Typography.caption1,
    fontVariant: ['tabular-nums'],
  },
});
