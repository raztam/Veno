import { useCallback } from 'react';

import { authenticateUser } from '@/features/security/authenticate';
import { useSecurityStore } from '@/features/security/security-store';

export function useSecurity() {
  const isUnlocked = useSecurityStore((state) => state.isUnlocked);
  const isAuthenticating = useSecurityStore((state) => state.isAuthenticating);
  const lock = useSecurityStore((state) => state.lock);
  const unlock = useSecurityStore((state) => state.unlock);

  const authenticate = useCallback(async () => {
    const result = await authenticateUser();
    if (result.success) {
      unlock();
    }
    return result;
  }, [unlock]);

  return {
    isUnlocked,
    isAuthenticating,
    lock,
    unlock,
    authenticate,
  };
}
