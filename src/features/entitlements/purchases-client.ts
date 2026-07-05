// Web / non-native fallback — real purchases require a native build.
import type { ProPlan, PurchaseOutcome, PurchasesInitResult } from './purchases-types';

export function isPurchasesSupported(): boolean {
  return false;
}

export async function initializePurchases(): Promise<PurchasesInitResult> {
  return { configured: false, rcAppUserId: null, isPro: false };
}

export function subscribeToProStatus(_listener: (isPro: boolean) => void): () => void {
  return () => {};
}

export async function fetchProPlan(): Promise<ProPlan | null> {
  return null;
}

export async function purchasePro(): Promise<PurchaseOutcome> {
  return {
    status: 'error',
    isPro: false,
    message: 'Purchases require a native iOS or Android build.',
  };
}

export async function restorePro(): Promise<PurchaseOutcome> {
  return {
    status: 'error',
    isPro: false,
    message: 'Purchases require a native iOS or Android build.',
  };
}
