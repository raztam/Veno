import { Platform } from 'react-native';

import ExpoDesertAntEarModule, { type EarDetection } from '../../../modules/expo-desert-ant-ear';
import { devLog } from '@/features/telemetry/dev-logger';

export type { EarDetection };

export function isEarSupported(): boolean {
  return (Platform.OS === 'ios' || Platform.OS === 'android') && ExpoDesertAntEarModule != null;
}

export function isEarModelDownloaded(): boolean {
  return ExpoDesertAntEarModule?.isDownloaded() ?? false;
}

let downloadPromise: Promise<void> | null = null;

export async function prefetchEarModel(): Promise<void> {
  const native = ExpoDesertAntEarModule;
  if (!native) {
    return;
  }

  if (native.isDownloaded()) {
    return;
  }

  if (!downloadPromise) {
    downloadPromise = native.download().catch((error) => {
      downloadPromise = null;
      throw error;
    });
  }

  await downloadPromise;
}

export async function detectSpokenLanguage(fileUri: string): Promise<EarDetection | null> {
  const native = ExpoDesertAntEarModule;
  if (!native) {
    return null;
  }

  try {
    await prefetchEarModel();
    const detection = await native.identify(fileUri);
    devLog.info('ear', 'Spoken language detection complete', detection);
    return detection;
  } catch (error) {
    devLog.warn('ear', 'Spoken language detection failed; Whisper will auto-detect', error);
    return null;
  }
}

export function isReliableEarLanguage(
  detection: EarDetection | null,
): detection is EarDetection & { language: string } {
  return Boolean(detection?.isReliable && detection.language);
}
