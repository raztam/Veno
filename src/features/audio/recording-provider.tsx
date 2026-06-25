import { createContext, useContext, type PropsWithChildren } from 'react';

import { useRecordingSession } from '@/features/audio/use-recording-session';

type RecordingSession = ReturnType<typeof useRecordingSession>;

const RecordingSessionContext = createContext<RecordingSession | null>(null);

export function RecordingProvider({ children }: PropsWithChildren) {
  const session = useRecordingSession();

  return (
    <RecordingSessionContext.Provider value={session}>{children}</RecordingSessionContext.Provider>
  );
}

export function useRecordingSessionContext() {
  const context = useContext(RecordingSessionContext);
  if (!context) {
    throw new Error('useRecordingSessionContext must be used within RecordingProvider');
  }
  return context;
}
