import { RecordingPresets, type RecordingOptions } from 'expo-audio';

export const RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  directory: 'document',
  isMeteringEnabled: true,
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
