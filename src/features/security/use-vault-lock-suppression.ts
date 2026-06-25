import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';

import { useSecurityStore } from '@/features/security/security-store';

function useVaultLockSuppressionEffect(active: boolean) {
  const increment = useSecurityStore((state) => state.incrementVaultLockSuppression);
  const decrement = useSecurityStore((state) => state.decrementVaultLockSuppression);

  useEffect(() => {
    if (!active) {
      return;
    }

    increment();
    return () => decrement();
  }, [active, decrement, increment]);
}

/** Suppress vault auto-lock while a screen is focused (e.g. record sheet). */
export function useSuppressVaultLockOnFocus() {
  const increment = useSecurityStore((state) => state.incrementVaultLockSuppression);
  const decrement = useSecurityStore((state) => state.decrementVaultLockSuppression);

  useFocusEffect(
    useCallback(() => {
      increment();
      return () => decrement();
    }, [decrement, increment]),
  );
}

/** Suppress vault auto-lock while `active` is true (e.g. during recording). */
export function useSuppressVaultLockWhile(active: boolean) {
  useVaultLockSuppressionEffect(active);
}
