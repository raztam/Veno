import { create } from 'zustand';

import { getVaultLockEnabled } from '@/features/security/vault-lock-preference';

type SecurityStore = {
  isUnlocked: boolean;
  isAuthenticating: boolean;
  vaultLockEnabled: boolean | null;
  vaultLockSuppressionCount: number;
  lock: () => void;
  unlock: () => void;
  setAuthenticating: (value: boolean) => void;
  hydrateVaultLockPreference: () => Promise<void>;
  setVaultLockEnabled: (enabled: boolean) => void;
  incrementVaultLockSuppression: () => void;
  decrementVaultLockSuppression: () => void;
};

export const useSecurityStore = create<SecurityStore>((set) => ({
  isUnlocked: false,
  isAuthenticating: false,
  vaultLockEnabled: null,
  vaultLockSuppressionCount: 0,
  lock: () =>
    set((state) => {
      if (state.vaultLockEnabled === false || state.vaultLockSuppressionCount > 0) {
        return state;
      }

      return { ...state, isUnlocked: false, isAuthenticating: false };
    }),
  unlock: () => set({ isUnlocked: true, isAuthenticating: false }),
  setAuthenticating: (value) => set({ isAuthenticating: value }),
  hydrateVaultLockPreference: async () => {
    const enabled = await getVaultLockEnabled();
    set({
      vaultLockEnabled: enabled,
      isUnlocked: !enabled,
    });
  },
  setVaultLockEnabled: (enabled) =>
    set((state) => ({
      vaultLockEnabled: enabled,
      isUnlocked: enabled ? state.isUnlocked : true,
    })),
  incrementVaultLockSuppression: () =>
    set((state) => ({ vaultLockSuppressionCount: state.vaultLockSuppressionCount + 1 })),
  decrementVaultLockSuppression: () =>
    set((state) => ({
      vaultLockSuppressionCount: Math.max(0, state.vaultLockSuppressionCount - 1),
    })),
}));
