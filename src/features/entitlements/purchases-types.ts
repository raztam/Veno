export type ProPlan = {
  /** RevenueCat package identifier (e.g. `$rc_monthly`). */
  packageId: string;
  /** Store product identifier (e.g. `pro_monthly`). */
  productId: string;
  /** Localized price string from the store (e.g. `$4.99`). */
  priceString: string;
  /** Human-readable billing period (e.g. `month`). */
  periodLabel: string;
  /** Store-configured intro offer label (e.g. `14-day free trial`), if eligible. */
  trialLabel: string | null;
};

export type PurchaseOutcome = {
  status: 'purchased' | 'restored' | 'cancelled' | 'not-entitled' | 'error';
  isPro: boolean;
  message?: string;
};

export type PurchasesInitResult = {
  configured: boolean;
  rcAppUserId: string | null;
  isPro: boolean;
};
