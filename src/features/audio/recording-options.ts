import { RecordingPresets, type RecordingOptions } from 'expo-audio';

/** Voice-note preset: mono AAC — better for speech and Whisper. */
export const RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  numberOfChannels: 1,
  bitRate: 96000,
  directory: 'document',
  isMeteringEnabled: true,
  android: {
    ...RecordingPresets.HIGH_QUALITY.android,
    audioSource: 'voice_recognition',
  },
  ios: {
    ...RecordingPresets.HIGH_QUALITY.ios,
  },
};

export function normalizeMetering(metering: number | undefined): number {
  if (metering == null) {
    return 0.08;
  }

  const clamped = Math.max(-60, Math.min(0, metering));
  return (clamped + 60) / 60;
}

export function formatRecordingTimer(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((durationMs % 1000) / 10);

  return `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}
