import { useEffect, type PropsWithChildren } from 'react';

import { useEntitlementsStore } from './entitlements-store';
import { initializePurchases, subscribeToProStatus } from './purchases-client';

/**
 * Configures RevenueCat once at startup and keeps the entitlements store in
 * sync with customer-info updates (purchases, renewals, trial expiry).
 */
export function EntitlementsProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    void initializePurchases().then((result) => {
      if (cancelled) {
        return;
      }

      const store = useEntitlementsStore.getState();
      store.setRcAppUserId(result.rcAppUserId);
      store.setIsPro(result.isPro);
      store.setReady(true);

      if (result.configured) {
        unsubscribe = subscribeToProStatus((isPro) => {
          useEntitlementsStore.getState().setIsPro(isPro);
        });
      }
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return children;
}
