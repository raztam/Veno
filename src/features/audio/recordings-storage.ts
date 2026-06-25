import { Directory, File, Paths } from 'expo-file-system';

const RECORDINGS_DIR_NAME = 'recordings';

export function getRecordingsDirectory(): Directory {
  const directory = new Directory(Paths.document, RECORDINGS_DIR_NAME);

  if (!directory.exists) {
    directory.create({ idempotent: true, intermediates: true });
  }

  return directory;
}

export function getRecordingFile(noteId: string): File {
  return new File(getRecordingsDirectory(), `${noteId}.m4a`);
}

export async function persistRecording(sourceUri: string, noteId: string): Promise<string> {
  const source = new File(sourceUri);
  const destination = getRecordingFile(noteId);

  if (!source.exists) {
    throw new Error('Recording file was not found.');
  }

  if (destination.exists) {
    destination.delete();
  }

  await source.move(destination);
  return destination.uri;
}
