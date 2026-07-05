import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useSecurityStore } from '@/features/security/security-store';
import { useSecurity } from '@/features/security/use-security';

export function useSecurityGate() {
  const router = useRouter();
  const { isUnlocked } = useSecurity();
  const vaultLockEnabled = useSecurityStore((state) => state.vaultLockEnabled);

  useEffect(() => {
    if (vaultLockEnabled !== true) {
      return;
    }

    if (!isUnlocked) {
      router.replace('/(lock)/lock');
    }
  }, [isUnlocked, router, vaultLockEnabled]);
}
