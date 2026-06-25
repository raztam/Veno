import { create } from 'zustand';

type SecurityStore = {
  isUnlocked: boolean;
  isAuthenticating: boolean;
  vaultLockSuppressionCount: number;
  lock: () => void;
  unlock: () => void;
  setAuthenticating: (value: boolean) => void;
  incrementVaultLockSuppression: () => void;
  decrementVaultLockSuppression: () => void;
};

export const useSecurityStore = create<SecurityStore>((set) => ({
  isUnlocked: false,
  isAuthenticating: false,
  vaultLockSuppressionCount: 0,
  lock: () =>
    set((state) =>
      state.vaultLockSuppressionCount > 0
        ? state
        : { ...state, isUnlocked: false, isAuthenticating: false },
    ),
  unlock: () => set({ isUnlocked: true, isAuthenticating: false }),
  setAuthenticating: (value) => set({ isAuthenticating: value }),
  incrementVaultLockSuppression: () =>
    set((state) => ({ vaultLockSuppressionCount: state.vaultLockSuppressionCount + 1 })),
  decrementVaultLockSuppression: () =>
    set((state) => ({
      vaultLockSuppressionCount: Math.max(0, state.vaultLockSuppressionCount - 1),
    })),
}));
