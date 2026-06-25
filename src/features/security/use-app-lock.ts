import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useSecurityStore } from '@/features/security/security-store';

export function useAppLock() {
  const lock = useSecurityStore((state) => state.lock);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const handleChange = (nextState: AppStateStatus) => {
      const wasActive = appState.current === 'active';
      const isBackgrounded = nextState === 'background' || nextState === 'inactive';

      if (wasActive && isBackgrounded) {
        lock();
      }

      appState.current = nextState;
    };

    const subscription = AppState.addEventListener('change', handleChange);
    return () => subscription.remove();
  }, [lock]);
}
