import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  PurchasesStoreProduct,
} from 'react-native-purchases';

import { PRO_ENTITLEMENT_ID, PRO_MONTHLY_PRODUCT_ID } from '@/constants/entitlements';
import { devLog } from '@/features/telemetry/dev-logger';

import type { ProPlan, PurchaseOutcome, PurchasesInitResult } from './purchases-types';

const LOG_TAG = 'entitlements';

let configured = false;
let cachedProPackage: PurchasesPackage | null = null;

function getApiKey(): string | null {
  const key =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

  return key ? key : null;
}

export function isPurchasesSupported(): boolean {
  return getApiKey() !== null;
}

function isProActive(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
}

export async function initializePurchases(): Promise<PurchasesInitResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    devLog.warn(LOG_TAG, 'RevenueCat API key missing — Pro purchases disabled.');
    return { configured: false, rcAppUserId: null, isPro: false };
  }

  try {
    if (!configured) {
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        if (apiKey.startsWith('test_')) {
          devLog.info(LOG_TAG, 'RevenueCat Test Store active — purchases use the RC test modal.');
        }
      }
      // Anonymous App User ID — RevenueCat restores it across reinstalls via
      // store receipts, so it can anchor cloud backup identity (Stage 10).
      Purchases.configure({ apiKey });
      configured = true;
    }

    const [rcAppUserId, customerInfo] = await Promise.all([
      Purchases.getAppUserID(),
      Purchases.getCustomerInfo(),
    ]);

    devLog.info(LOG_TAG, `RevenueCat configured (appUserId: ${rcAppUserId})`);
    return { configured: true, rcAppUserId, isPro: isProActive(customerInfo) };
  } catch (error) {
    devLog.error(LOG_TAG, 'Failed to initialize RevenueCat', error);
    return { configured, rcAppUserId: null, isPro: false };
  }
}

export function subscribeToProStatus(listener: (isPro: boolean) => void): () => void {
  if (!configured) {
    return () => {};
  }

  const customerInfoListener = (customerInfo: CustomerInfo) => {
    listener(isProActive(customerInfo));
  };

  Purchases.addCustomerInfoUpdateListener(customerInfoListener);
  return () => {
    Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
  };
}

function formatPeriodLabel(product: PurchasesStoreProduct): string {
  // subscriptionPeriod is ISO 8601, e.g. P1M / P1W / P1Y.
  switch (product.subscriptionPeriod) {
    case 'P1W':
      return 'week';
    case 'P1Y':
      return 'year';
    case 'P1M':
    default:
      return 'month';
  }
}

function formatTrialLabel(product: PurchasesStoreProduct): string | null {
  const intro = product.introPrice;
  if (!intro || intro.price !== 0) {
    return null;
  }

  const unit = intro.periodUnit.toLowerCase(); // DAY / WEEK / MONTH / YEAR
  const count = intro.periodNumberOfUnits;
  return `${count}-${unit} free trial`;
}

function findProPackage(offering: PurchasesOffering): PurchasesPackage | null {
  const byProduct = offering.availablePackages.find(
    (pkg) => pkg.product.identifier === PRO_MONTHLY_PRODUCT_ID,
  );

  return byProduct ?? offering.monthly ?? offering.availablePackages[0] ?? null;
}

export async function fetchProPlan(): Promise<ProPlan | null> {
  if (!configured) {
    return null;
  }

  try {
    const offerings = await Purchases.getOfferings();
    const offering = offerings.current;
    if (!offering) {
      devLog.warn(LOG_TAG, 'No current RevenueCat offering configured.');
      return null;
    }

    const proPackage = findProPackage(offering);
    if (!proPackage) {
      devLog.warn(LOG_TAG, 'Current offering has no packages.');
      return null;
    }

    cachedProPackage = proPackage;

    return {
      packageId: proPackage.identifier,
      productId: proPackage.product.identifier,
      priceString: proPackage.product.priceString,
      periodLabel: formatPeriodLabel(proPackage.product),
      trialLabel: formatTrialLabel(proPackage.product),
    };
  } catch (error) {
    devLog.error(LOG_TAG, 'Failed to load offerings', error);
    throw error;
  }
}

function isUserCancelled(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'userCancelled' in error &&
    (error as { userCancelled?: boolean }).userCancelled === true
  );
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) {
      return message;
    }
  }
  return fallback;
}

export async function purchasePro(): Promise<PurchaseOutcome> {
  if (!configured) {
    return { status: 'error', isPro: false, message: 'Purchases are not available.' };
  }

  try {
    if (!cachedProPackage) {
      await fetchProPlan();
    }

    const proPackage = cachedProPackage;
    if (!proPackage) {
      return { status: 'error', isPro: false, message: 'No subscription plan is available.' };
    }

    const { customerInfo } = await Purchases.purchasePackage(proPackage);
    const isPro = isProActive(customerInfo);
    devLog.info(LOG_TAG, `Purchase completed (pro: ${isPro})`);
    return { status: isPro ? 'purchased' : 'not-entitled', isPro };
  } catch (error) {
    if (isUserCancelled(error)) {
      return { status: 'cancelled', isPro: false };
    }

    devLog.error(LOG_TAG, 'Purchase failed', error);
    return {
      status: 'error',
      isPro: false,
      message: errorMessage(error, 'Purchase failed. Please try again.'),
    };
  }
}

export async function restorePro(): Promise<PurchaseOutcome> {
  if (!configured) {
    return { status: 'error', isPro: false, message: 'Purchases are not available.' };
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPro = isProActive(customerInfo);
    devLog.info(LOG_TAG, `Restore completed (pro: ${isPro})`);
    return { status: isPro ? 'restored' : 'not-entitled', isPro };
  } catch (error) {
    devLog.error(LOG_TAG, 'Restore failed', error);
    return {
      status: 'error',
      isPro: false,
      message: errorMessage(error, 'Could not restore purchases. Please try again.'),
    };
  }
}
