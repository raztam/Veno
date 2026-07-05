import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { dailyUsage } from '@/db/schema';

import { getTodayLocalDate } from './gating';

const SINGLETON_ID = 'singleton';

/**
 * Recorded milliseconds for the current local calendar day. A stale row from
 * a previous day counts as zero — it is overwritten on the next write.
 */
export async function getRecordedMsToday(): Promise<number> {
  const [row] = await db.select().from(dailyUsage).where(eq(dailyUsage.id, SINGLETON_ID));

  if (!row || row.usageDate !== getTodayLocalDate()) {
    return 0;
  }

  return row.recordedMs;
}

/** Bookkeeping after a recording stops — enforcement already happened live. */
export async function addRecordedMs(durationMs: number): Promise<number> {
  if (durationMs <= 0) {
    return getRecordedMsToday();
  }

  const today = getTodayLocalDate();
  const current = await getRecordedMsToday();
  const next = current + durationMs;

  await db
    .insert(dailyUsage)
    .values({ id: SINGLETON_ID, usageDate: today, recordedMs: next })
    .onConflictDoUpdate({
      target: dailyUsage.id,
      set: { usageDate: today, recordedMs: next },
    });

  return next;
}
