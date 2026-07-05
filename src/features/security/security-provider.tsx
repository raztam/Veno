import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';

import { useAppLock } from '@/features/security/use-app-lock';
import { useSecurityStore } from '@/features/security/security-store';

export function SecurityProvider({ children }: PropsWithChildren) {
  const hydrateVaultLockPreference = useSecurityStore((state) => state.hydrateVaultLockPreference);

  useEffect(() => {
    void hydrateVaultLockPreference();
  }, [hydrateVaultLockPreference]);

  useAppLock();
  return children;
}
