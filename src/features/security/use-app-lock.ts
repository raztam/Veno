import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useSecurityStore } from '@/features/security/security-store';

const BACKGROUND_LOCK_DELAY_MS = 750;

export function useAppLock() {
  const lock = useSecurityStore((state) => state.lock);
  const appState = useRef(AppState.currentState);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearLockTimer = () => {
      if (lockTimer.current) {
        clearTimeout(lockTimer.current);
        lockTimer.current = null;
      }
    };

    const handleChange = (nextState: AppStateStatus) => {
      const wasInForeground =
        appState.current === 'active' || appState.current === 'inactive';

      if (wasInForeground && nextState === 'background') {
        clearLockTimer();
        lockTimer.current = setTimeout(() => {
          if (AppState.currentState === 'background') {
            lock();
          }
        }, BACKGROUND_LOCK_DELAY_MS);
      }

      if (nextState === 'active') {
        clearLockTimer();
      }

      appState.current = nextState;
    };

    const subscription = AppState.addEventListener('change', handleChange);
    return () => {
      clearLockTimer();
      subscription.remove();
    };
  }, [lock]);
}
