import { useDevLogStore } from './dev-logger';

export function useDevLogs() {
  const entries = useDevLogStore((state) => state.entries);
  const clear = useDevLogStore((state) => state.clear);

  return { entries, clear };
}
