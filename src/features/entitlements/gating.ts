import { TIER_LIMITS, type Tier } from '@/constants/entitlements';

export function getEffectiveLimits(isPro: boolean) {
  const tier: Tier = isPro ? 'pro' : 'free';
  return TIER_LIMITS[tier];
}

/** Daily recording cap in milliseconds, or `null` when unlimited. */
export function getDailyRecordCapMs(isPro: boolean): number | null {
  const minutes = getEffectiveLimits(isPro).recordMinutesPerDay;
  return minutes === null ? null : minutes * 60_000;
}

/** Remaining recording allowance for today. `Infinity` when unlimited. */
export function getRemainingRecordMs(recordedMsToday: number, isPro: boolean): number {
  const capMs = getDailyRecordCapMs(isPro);
  if (capMs === null) {
    return Infinity;
  }

  return Math.max(0, capMs - recordedMsToday);
}

export function canStartRecording(recordedMsToday: number, isPro: boolean): boolean {
  return getRemainingRecordMs(recordedMsToday, isPro) > 0;
}

/** Smart analysis (transcribe + summarize) is uncapped on every tier. */
export function canAnalyze(isPro: boolean): boolean {
  return getEffectiveLimits(isPro).smartAnalysisPerDay === null;
}

/** Local `YYYY-MM-DD` — usage counters reset at midnight device time. */
export function getTodayLocalDate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMsUntilMidnight(now: Date = new Date()): number {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

export function formatAllowance(ms: number): string {
  if (!Number.isFinite(ms)) {
    return 'Unlimited';
  }

  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatTimeUntilReset(now: Date = new Date()): string {
  const ms = getMsUntilMidnight(now);
  const totalMinutes = Math.ceil(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  return `${hours} h ${minutes} min`;
}
