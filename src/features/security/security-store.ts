import { create } from 'zustand';

type SecurityStore = {
  isUnlocked: boolean;
  isAuthenticating: boolean;
  lock: () => void;
  unlock: () => void;
  setAuthenticating: (value: boolean) => void;
};

export const useSecurityStore = create<SecurityStore>((set) => ({
  isUnlocked: false,
  isAuthenticating: false,
  lock: () => set({ isUnlocked: false, isAuthenticating: false }),
  unlock: () => set({ isUnlocked: true, isAuthenticating: false }),
  setAuthenticating: (value) => set({ isAuthenticating: value }),
}));
