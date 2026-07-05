import { create } from 'zustand';

type EntitlementsStore = {
  /** RevenueCat finished (or failed) initializing. */
  isReady: boolean;
  /** Active `pro` entitlement (paid subscription or store-managed trial). */
  isPro: boolean;
  /** Stable RevenueCat App User ID — anchors cloud backup identity (Stage 10). */
  rcAppUserId: string | null;
  setReady: (ready: boolean) => void;
  setIsPro: (isPro: boolean) => void;
  setRcAppUserId: (rcAppUserId: string | null) => void;
};

export const useEntitlementsStore = create<EntitlementsStore>((set) => ({
  isReady: false,
  isPro: false,
  rcAppUserId: null,
  setReady: (isReady) => set({ isReady }),
  setIsPro: (isPro) => set({ isPro }),
  setRcAppUserId: (rcAppUserId) => set({ rcAppUserId }),
}));

export function useIsPro(): boolean {
  return useEntitlementsStore((state) => state.isPro);
}

export function useRcAppUserId(): string | null {
  return useEntitlementsStore((state) => state.rcAppUserId);
}

/** Non-hook accessor for services outside React (e.g. backup scheduler). */
export function getRcAppUserId(): string | null {
  return useEntitlementsStore.getState().rcAppUserId;
}
