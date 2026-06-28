import { Platform } from 'react-native';

import { devLog } from '@/features/telemetry/dev-logger';

import { ensureWhisperModel } from './model-storage';
import { useTranscriptionStore } from './transcription-store';

type WhisperContext = import('whisper.rn').WhisperContext;

let whisperContext: WhisperContext | null = null;
let whisperContextPromise: Promise<WhisperContext> | null = null;
let loadedModelPath: string | null = null;

function resetWhisperContext(): void {
  whisperContext = null;
  whisperContextPromise = null;
  loadedModelPath = null;
}

export function isWhisperSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export async function getWhisperContext(): Promise<WhisperContext> {
  if (!isWhisperSupported()) {
    throw new Error('On-device transcription is only available on iOS and Android.');
  }

  if (!whisperContextPromise) {
    whisperContextPromise = (async () => {
      const { setModelStatus, setModelProgress } = useTranscriptionStore.getState();

      setModelStatus('downloading');
      devLog.info('whisper', 'Initializing Whisper context');
      const modelPath = await ensureWhisperModel(setModelProgress);

      if (whisperContext && loadedModelPath !== modelPath) {
        devLog.info('whisper', 'Whisper model changed — releasing previous context');
        await whisperContext.release();
        whisperContext = null;
      }

      setModelStatus('ready');

      const { initWhisper } = await import('whisper.rn');
      const context = await initWhisper({ filePath: modelPath });
      whisperContext = context;
      loadedModelPath = modelPath;
      devLog.info('whisper', 'Whisper context ready', { modelPath });
      return context;
    })().catch((error) => {
      resetWhisperContext();
      useTranscriptionStore.getState().setModelStatus('error');
      devLog.error('whisper', 'Failed to initialize Whisper context', error);
      throw error;
    });
  }

  return whisperContextPromise;
}
