import { Directory, File, Paths } from 'expo-file-system';

import { devLog } from '@/features/telemetry/dev-logger';

const TRANSCRIBE_CACHE_DIR = 'transcribe-cache';

export type WhisperAudioSource = {
  wavUri: string;
  cleanup: () => void;
};

function toFilesystemPath(uri: string): string {
  return uri.startsWith('file://') ? decodeURI(uri.slice(7)) : uri;
}

function toFileUri(path: string): string {
  return path.startsWith('file://') ? path : `file://${path}`;
}

export function isWavUri(uri: string): boolean {
  const withoutQuery = uri.split('?')[0] ?? uri;
  return withoutQuery.toLowerCase().endsWith('.wav');
}

function getTranscribeCacheDirectory(): Directory {
  const directory = new Directory(Paths.cache, TRANSCRIBE_CACHE_DIR);

  if (!directory.exists) {
    directory.create({ idempotent: true, intermediates: true });
  }

  return directory;
}

function getTempWavFile(noteId: string): File {
  return new File(getTranscribeCacheDirectory(), `${noteId}.wav`);
}

export async function prepareWhisperAudio(
  audioUri: string,
  noteId: string,
): Promise<WhisperAudioSource> {
  const sourceFile = new File(audioUri);
  if (!sourceFile.exists) {
    throw new Error('Recording file was not found.');
  }

  if (isWavUri(audioUri)) {
    return {
      wavUri: audioUri,
      cleanup: () => {},
    };
  }

  const outputFile = getTempWavFile(noteId);
  if (outputFile.exists) {
    outputFile.delete();
  }

  devLog.info('transcription', `Converting audio to WAV for note ${noteId}`, {
    source: audioUri,
    output: outputFile.uri,
  });

  const { extractAudio } = await import('expo-video-audio-extractor');
  const sourcePath = toFilesystemPath(audioUri);
  const outputPath = toFilesystemPath(outputFile.uri);

  // Do not override sampleRate/channels — the extractor writes decoded PCM as-is.
  // Mis-matched headers (e.g. 16 kHz mono label on 44.1 kHz stereo data) garble Whisper output.
  // whisper.rn resamples and downmixes to 16 kHz mono from a correct WAV header.
  await extractAudio({
    video: sourcePath,
    output: outputPath,
    format: 'wav',
  });

  if (!outputFile.exists || outputFile.size === 0) {
    throw new Error('Audio conversion did not produce a WAV file.');
  }

  devLog.info('transcription', `WAV conversion complete for note ${noteId}`, {
    wavUri: outputFile.uri,
    bytes: outputFile.size,
  });

  return {
    wavUri: toFileUri(outputPath),
    cleanup: () => {
      if (outputFile.exists) {
        outputFile.delete();
      }
    },
  };
}
