import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useEffect } from 'react';

type UseNotePlaybackOptions = {
  audioUri: string;
  fallbackDurationMs: number;
};

export function useNotePlayback({ audioUri, fallbackDurationMs }: UseNotePlaybackOptions) {
  const player = useAudioPlayer(audioUri, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    void setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });
  }, []);

  const durationMs = Math.max(
    status.duration > 0 ? status.duration * 1000 : 0,
    fallbackDurationMs,
  );
  const currentTimeMs = status.currentTime * 1000;
  const progress = durationMs > 0 ? Math.min(currentTimeMs / durationMs, 1) : 0;

  const togglePlay = useCallback(async () => {
    if (status.playing) {
      player.pause();
      return;
    }

    if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration - 0.05)) {
      await player.seekTo(0);
    }

    player.play();
  }, [player, status.currentTime, status.didJustFinish, status.duration, status.playing]);

  const seekToProgress = useCallback(
    async (nextProgress: number) => {
      if (durationMs <= 0) {
        return;
      }

      const clamped = Math.max(0, Math.min(nextProgress, 1));
      await player.seekTo((durationMs * clamped) / 1000);
    },
    [durationMs, player],
  );

  return {
    isPlaying: status.playing,
    isLoading: !status.isLoaded && !status.error,
    error: status.error,
    currentTimeMs,
    durationMs,
    progress,
    togglePlay,
    seekToProgress,
  };
}
