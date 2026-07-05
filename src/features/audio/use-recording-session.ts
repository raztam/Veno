import {
  setAudioModeAsync,
  useAudioRecorder,
  type AudioRecorder,
  type RecorderState,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import { createNoteId } from '@/features/notes/repository';

import {
  ensureMicrophonePermission,
  openAppSettings,
} from './microphone-permission';
import { persistRecording } from './recordings-storage';
import { normalizeMetering, RECORDING_OPTIONS } from './recording-options';

export type RecordingPhase = 'idle' | 'recording' | 'paused' | 'saving';

export type StopResult = {
  noteId: string;
  audioUri: string;
  durationMs: number;
};

export type StartRecordingOptions = {
  /**
   * Hard session cap in ms (e.g. remaining daily allowance). When reached the
   * recorder auto-stops, saves the clip, and fires `onLimitReached`.
   * Omit or pass `Infinity` for unlimited.
   */
  maxDurationMs?: number;
  onLimitReached?: (result: StopResult | null) => void;
};

const IDLE_RECORDER_STATE: RecorderState = {
  canRecord: false,
  isRecording: false,
  durationMillis: 0,
  mediaServicesDidReset: false,
  url: null,
};

function safeGetStatus(recorder: AudioRecorder): RecorderState | null {
  try {
    return recorder.getStatus();
  } catch {
    return null;
  }
}

function safeIsRecording(recorder: AudioRecorder): boolean {
  try {
    return recorder.isRecording;
  } catch {
    return false;
  }
}

async function safeStop(recorder: AudioRecorder): Promise<void> {
  if (!safeIsRecording(recorder)) {
    return;
  }

  try {
    await recorder.stop();
  } catch {
    // Recorder was already released.
  }
}

export function useRecordingSession() {
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const noteIdRef = useRef<string | null>(null);
  const phaseRef = useRef<RecordingPhase>('idle');
  const maxDurationMsRef = useRef<number | null>(null);
  const onLimitReachedRef = useRef<StartRecordingOptions['onLimitReached']>(undefined);
  const limitTriggeredRef = useRef(false);
  const stopAndSaveRef = useRef<() => Promise<StopResult | null>>(async () => null);

  const [phase, setPhase] = useState<RecordingPhase>('idle');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [durationMillis, setDurationMillis] = useState(0);
  const [meteringSamples, setMeteringSamples] = useState<number[]>([]);

  phaseRef.current = phase;

  useEffect(() => {
    void (async () => {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
    })();
  }, []);

  useEffect(() => {
    const shouldMonitor = phase === 'recording' || phase === 'paused';
    if (!shouldMonitor) {
      return;
    }

    const update = () => {
      const status = safeGetStatus(recorder);
      if (!status) {
        return;
      }

      setDurationMillis(status.durationMillis);

      if (phaseRef.current === 'recording' && status.metering != null) {
        setMeteringSamples((current) => {
          const next = [...current, normalizeMetering(status.metering)];
          return next.slice(-80);
        });
      }

      // Live daily-allowance enforcement: auto-stop at the cap so the user
      // can never record past their limit and be rejected after the fact.
      const maxDurationMs = maxDurationMsRef.current;
      if (
        maxDurationMs !== null &&
        phaseRef.current === 'recording' &&
        status.durationMillis >= maxDurationMs &&
        !limitTriggeredRef.current
      ) {
        limitTriggeredRef.current = true;
        void stopAndSaveRef.current().then((result) => {
          onLimitReachedRef.current?.(result);
        });
      }
    };

    update();
    const interval = setInterval(update, 100);
    return () => clearInterval(interval);
  }, [phase, recorder.id]);

  const ensurePermissions = useCallback(async () => {
    const result = await ensureMicrophonePermission();

    if (result.granted) {
      setPermissionDenied(false);
      setPermissionBlocked(false);
      return true;
    }

    setPermissionDenied(true);
    setPermissionBlocked(result.reason === 'blocked');
    return false;
  }, []);

  const openMicrophoneSettings = useCallback(() => {
    openAppSettings();
  }, []);

  const start = useCallback(async (options?: StartRecordingOptions) => {
    setError(null);

    const granted = await ensurePermissions();
    if (!granted) {
      return;
    }

    const maxDurationMs = options?.maxDurationMs;
    maxDurationMsRef.current =
      maxDurationMs !== undefined && Number.isFinite(maxDurationMs) ? maxDurationMs : null;
    onLimitReachedRef.current = options?.onLimitReached;
    limitTriggeredRef.current = false;

    try {
      noteIdRef.current = createNoteId();
      setMeteringSamples([]);
      setDurationMillis(0);
      await recorder.prepareToRecordAsync(RECORDING_OPTIONS);
      recorder.record();
      setPhase('recording');
    } catch (startError) {
      noteIdRef.current = null;
      setError(startError instanceof Error ? startError.message : 'Could not start recording.');
      setPhase('idle');
    }
  }, [ensurePermissions, recorder]);

  const pause = useCallback(() => {
    if (!safeIsRecording(recorder)) {
      return;
    }

    try {
      recorder.pause();
      setPhase('paused');
    } catch {
      setError('Could not pause recording.');
    }
  }, [recorder]);

  const resume = useCallback(() => {
    if (phase !== 'paused') {
      return;
    }

    try {
      recorder.record();
      setPhase('recording');
    } catch {
      setError('Could not resume recording.');
    }
  }, [phase, recorder]);

  const reset = useCallback(async () => {
    await safeStop(recorder);

    noteIdRef.current = null;
    maxDurationMsRef.current = null;
    onLimitReachedRef.current = undefined;
    limitTriggeredRef.current = false;
    setMeteringSamples([]);
    setDurationMillis(0);
    setPhase('idle');
    setError(null);
  }, [recorder]);

  const stopAndSave = useCallback(async (): Promise<StopResult | null> => {
    const noteId = noteIdRef.current;
    if (!noteId || phaseRef.current === 'saving') {
      return null;
    }

    phaseRef.current = 'saving';
    setPhase('saving');
    setError(null);

    try {
      const status = safeGetStatus(recorder) ?? IDLE_RECORDER_STATE;
      const durationMs = Math.max(status.durationMillis, durationMillis);
      await safeStop(recorder);

      let tempUri: string | null = null;
      try {
        tempUri = recorder.uri;
      } catch {
        tempUri = null;
      }

      if (!tempUri) {
        throw new Error('Recording file was not created.');
      }

      const audioUri = await persistRecording(tempUri, noteId);
      noteIdRef.current = null;
      maxDurationMsRef.current = null;
      setMeteringSamples([]);
      setDurationMillis(0);
      setPhase('idle');

      return {
        noteId,
        audioUri,
        durationMs,
      };
    } catch (stopError) {
      setError(stopError instanceof Error ? stopError.message : 'Could not save recording.');
      setPhase(safeIsRecording(recorder) ? 'recording' : 'paused');
      return null;
    }
  }, [durationMillis, recorder]);

  stopAndSaveRef.current = stopAndSave;

  return {
    phase,
    permissionDenied,
    permissionBlocked,
    error,
    durationMillis,
    meteringSamples,
    start,
    pause,
    resume,
    reset,
    stopAndSave,
    ensurePermissions,
    openMicrophoneSettings,
  };
}
