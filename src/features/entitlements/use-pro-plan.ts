import { useMutation, useQuery } from '@tanstack/react-query';

import { useEntitlementsStore } from './entitlements-store';
import { entitlementsKeys } from './query-keys';
import { fetchProPlan, isPurchasesSupported, purchasePro, restorePro } from './purchases-client';
import type { PurchaseOutcome } from './purchases-types';

export function useProPlan() {
  const isReady = useEntitlementsStore((state) => state.isReady);

  return useQuery({
    queryKey: entitlementsKeys.proPlan(),
    queryFn: fetchProPlan,
    enabled: isReady && isPurchasesSupported(),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

function applyOutcome(outcome: PurchaseOutcome) {
  if (outcome.status === 'purchased' || outcome.status === 'restored') {
    useEntitlementsStore.getState().setIsPro(outcome.isPro);
  }
}

export function usePurchasePro() {
  return useMutation({
    mutationFn: purchasePro,
    onSuccess: applyOutcome,
  });
}

export function useRestorePurchases() {
  return useMutation({
    mutationFn: restorePro,
    onSuccess: applyOutcome,
  });
}
