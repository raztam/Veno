/**
 * Single source of truth for tier limits. Gating code in
 * `features/entitlements/` reads from this object — tune values here without
 * touching gating logic. `null` means unlimited.
 */
export const TIER_LIMITS = {
  free: {
    recordMinutesPerDay: 5,
    smartAnalysisPerDay: null,
  },
  pro: {
    recordMinutesPerDay: null,
    smartAnalysisPerDay: null,
  },
} as const;

export type Tier = keyof typeof TIER_LIMITS;

/** RevenueCat entitlement identifier that unlocks the Pro tier. */
export const PRO_ENTITLEMENT_ID = 'pro';

/** RevenueCat product identifier for the monthly Pro subscription. */
export const PRO_MONTHLY_PRODUCT_ID = 'pro_monthly';

export const PRO_FEATURES = [
  'Unlimited recording time',
  'Encrypted cloud backup & restore',
  'Export to Markdown & share sheet',
  'On-device transcription & AI analysis',
] as const;

export const FREE_FEATURES = [
  `${TIER_LIMITS.free.recordMinutesPerDay} minutes of recording per day`,
  'Unlimited smart analysis',
  'On-device transcription & AI analysis',
  'Biometric vault lock',
] as const;
