import type { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';

import { useNotes, useUpdateNote } from '@/features/notes/use-notes';
import { devLog } from '@/features/telemetry/dev-logger';

import { isNoteTranscriptionQueued } from './transcription-queue';
import { useTranscriptionStore } from './transcription-store';
import { useTranscribe } from './use-transcribe';
import { isWhisperSupported } from './whisper-service';

export function TranscriptionProvider({ children }: PropsWithChildren) {
  const { data: notes } = useNotes();
  const updateNote = useUpdateNote();
  const { transcribeNote } = useTranscribe();
  const modelStatus = useTranscriptionStore((state) => state.modelStatus);
  const recoveredStuckNotesRef = useRef(false);

  useEffect(() => {
    if (!isWhisperSupported() || !notes || recoveredStuckNotesRef.current) {
      return;
    }

    const stuckNotes = notes.filter((note) => note.status === 'transcribing');
    if (stuckNotes.length === 0) {
      recoveredStuckNotesRef.current = true;
      return;
    }

    recoveredStuckNotesRef.current = true;

    void (async () => {
      for (const note of stuckNotes) {
        devLog.warn('transcription', `Recovering stuck note ${note.id} from transcribing -> recorded`);
        await updateNote.mutateAsync({
          id: note.id,
          updates: { status: 'recorded' },
        });
      }
    })();
  }, [notes, updateNote]);

  useEffect(() => {
    if (!isWhisperSupported()) {
      return;
    }

    const pendingNote = notes?.find((note) => note.status === 'recorded');
    if (!pendingNote || isNoteTranscriptionQueued(pendingNote.id)) {
      return;
    }

    devLog.info('transcription', `Queueing auto-transcription for note ${pendingNote.id}`);
    void transcribeNote(pendingNote);
  }, [notes, transcribeNote, modelStatus]);

  return children;
}
