import { useCallback } from 'react';

import { authenticateUser } from '@/features/security/authenticate';
import { useSecurityStore } from '@/features/security/security-store';

export function useSecurity() {
  const isUnlocked = useSecurityStore((state) => state.isUnlocked);
  const isAuthenticating = useSecurityStore((state) => state.isAuthenticating);
  const lock = useSecurityStore((state) => state.lock);
  const unlock = useSecurityStore((state) => state.unlock);
  const setAuthenticating = useSecurityStore((state) => state.setAuthenticating);

  const authenticate = useCallback(async () => {
    setAuthenticating(true);
    try {
      const result = await authenticateUser();
      if (result.success) {
        unlock();
      }
      return result;
    } finally {
      setAuthenticating(false);
    }
  }, [setAuthenticating, unlock]);

  return {
    isUnlocked,
    isAuthenticating,
    lock,
    unlock,
    authenticate,
  };
}
