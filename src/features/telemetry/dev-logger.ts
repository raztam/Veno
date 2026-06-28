import { Platform } from 'react-native';
import { create } from 'zustand';

export type DevLogLevel = 'debug' | 'info' | 'warn' | 'error';

export type DevLogEntry = {
  id: string;
  level: DevLogLevel;
  tag: string;
  message: string;
  details?: string;
  timestamp: number;
};

const MAX_LOG_ENTRIES = 500;
const LOG_DIR_NAME = 'logs';
const LOG_FILE_NAME = 'veno-debug.log';

let entryCounter = 0;

type DevLogStore = {
  entries: DevLogEntry[];
  append: (entry: DevLogEntry) => void;
  clear: () => void;
};

export const useDevLogStore = create<DevLogStore>((set) => ({
  entries: [],
  append: (entry) =>
    set((state) => ({
      entries: [...state.entries, entry].slice(-MAX_LOG_ENTRIES),
    })),
  clear: () => set({ entries: [] }),
}));

function isNativeDevice(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

function serializeEntry(entry: DevLogEntry): string {
  const time = new Date(entry.timestamp).toISOString();
  const details = entry.details ? `\n  ${entry.details}` : '';
  return `[${time}] [${entry.level.toUpperCase()}] [${entry.tag}] ${entry.message}${details}`;
}

function withLogFile<T>(run: (file: import('expo-file-system').File) => T): T | null {
  if (!isNativeDevice()) {
    return null;
  }

  try {
    const { Directory, File, Paths } = require('expo-file-system') as typeof import('expo-file-system');
    const directory = new Directory(Paths.document, LOG_DIR_NAME);

    if (!directory.exists) {
      directory.create({ idempotent: true, intermediates: true });
    }

    return run(new File(directory, LOG_FILE_NAME));
  } catch {
    return null;
  }
}

function appendToLogFile(entry: DevLogEntry): void {
  withLogFile((file) => {
    const line = `${serializeEntry(entry)}\n`;
    const existing = file.exists ? file.textSync() : '';
    file.write(existing + line);
    return true;
  });
}

function createEntry(
  level: DevLogLevel,
  tag: string,
  message: string,
  details?: string,
): DevLogEntry {
  entryCounter += 1;
  return {
    id: `${Date.now()}-${entryCounter}`,
    level,
    tag,
    message,
    details,
    timestamp: Date.now(),
  };
}

function pushLog(level: DevLogLevel, tag: string, message: string, details?: string): void {
  const entry = createEntry(level, tag, message, details);
  useDevLogStore.getState().append(entry);

  if (isNativeDevice()) {
    appendToLogFile(entry);
  }
}

function formatUnknown(value: unknown): string {
  if (value instanceof Error) {
    return value.stack ?? value.message;
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export const devLog = {
  debug(tag: string, message: string, details?: unknown) {
    pushLog('debug', tag, message, details === undefined ? undefined : formatUnknown(details));
  },
  info(tag: string, message: string, details?: unknown) {
    pushLog('info', tag, message, details === undefined ? undefined : formatUnknown(details));
  },
  warn(tag: string, message: string, details?: unknown) {
    pushLog('warn', tag, message, details === undefined ? undefined : formatUnknown(details));
  },
  error(tag: string, message: string, details?: unknown) {
    pushLog('error', tag, message, details === undefined ? undefined : formatUnknown(details));
  },
};

export function formatDevLogsForExport(entries: DevLogEntry[]): string {
  if (entries.length === 0) {
    return 'No logs captured yet.';
  }

  return entries.map(serializeEntry).join('\n\n');
}

export function getDevLogFileUri(): string | null {
  return withLogFile((file) => (file.exists ? file.uri : null));
}

export function clearDevLogFile(): void {
  withLogFile((file) => {
    if (file.exists) {
      file.delete();
    }

    return true;
  });
}
