import { useCallback, useState } from 'react';

import { authenticateUser } from '@/features/security/authenticate';
import { useSecurityStore } from '@/features/security/security-store';
import { setVaultLockEnabled as persistVaultLockEnabled } from '@/features/security/vault-lock-preference';

export function useVaultLockPreference() {
  const vaultLockEnabled = useSecurityStore((state) => state.vaultLockEnabled);
  const setVaultLockEnabled = useSecurityStore((state) => state.setVaultLockEnabled);
  const lock = useSecurityStore((state) => state.lock);
  const unlock = useSecurityStore((state) => state.unlock);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleVaultLock = useCallback(
    async (nextEnabled: boolean) => {
      if (vaultLockEnabled === nextEnabled) {
        return { success: true as const };
      }

      setIsUpdating(true);
      try {
        if (!nextEnabled) {
          const result = await authenticateUser({
            promptMessage: 'Disable vault lock',
            promptSubtitle: 'Verify your identity to turn off biometric protection',
          });

          if (!result.success) {
            return { success: false as const, reason: result.reason };
          }
        }

        await persistVaultLockEnabled(nextEnabled);
        setVaultLockEnabled(nextEnabled);

        if (nextEnabled) {
          lock();
        } else {
          unlock();
        }

        return { success: true as const };
      } finally {
        setIsUpdating(false);
      }
    },
    [lock, setVaultLockEnabled, unlock, vaultLockEnabled],
  );

  return {
    vaultLockEnabled: vaultLockEnabled ?? true,
    isHydrated: vaultLockEnabled !== null,
    isUpdating,
    toggleVaultLock,
  };
}
