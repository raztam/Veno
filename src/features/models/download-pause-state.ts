import { Directory, File, Paths } from 'expo-file-system';
import type { DownloadPauseState } from 'expo-file-system';

const PAUSE_DIR_NAME = 'models';
const WHISPER_PAUSE_FILENAME = 'whisper-download.pause.json';

function getPauseFile(): File {
  const directory = new Directory(Paths.document, PAUSE_DIR_NAME);
  if (!directory.exists) {
    directory.create({ idempotent: true, intermediates: true });
  }

  return new File(directory, WHISPER_PAUSE_FILENAME);
}

export function readWhisperDownloadPauseState(): DownloadPauseState | null {
  const file = getPauseFile();
  if (!file.exists) {
    return null;
  }

  try {
    return JSON.parse(file.textSync()) as DownloadPauseState;
  } catch {
    return null;
  }
}

export function writeWhisperDownloadPauseState(state: DownloadPauseState): void {
  const file = getPauseFile();
  file.write(JSON.stringify(state));
}

export function clearWhisperDownloadPauseState(): void {
  const file = getPauseFile();
  if (file.exists) {
    file.delete();
  }
}
