import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useIsPro } from './entitlements-store';
import { canStartRecording, getRemainingRecordMs } from './gating';
import { entitlementsKeys } from './query-keys';
import { addRecordedMs, getRecordedMsToday } from './usage-repository';

export function useDailyUsage() {
  return useQuery({
    queryKey: entitlementsKeys.usage(),
    queryFn: getRecordedMsToday,
    // Recheck when the screen regains focus so the midnight reset is picked up.
    staleTime: 10_000,
  });
}

export function useAddRecordedMs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (durationMs: number) => addRecordedMs(durationMs),
    onSuccess: (recordedMsToday) => {
      queryClient.setQueryData(entitlementsKeys.usage(), recordedMsToday);
    },
  });
}

export type RecordingAllowance = {
  isLoading: boolean;
  isPro: boolean;
  recordedMsToday: number;
  /** Remaining daily allowance in ms — `Infinity` for Pro. */
  remainingMs: number;
  canStart: boolean;
};

export function useRecordingAllowance(): RecordingAllowance {
  const isPro = useIsPro();
  const { data: recordedMsToday, isLoading } = useDailyUsage();

  const usedMs = recordedMsToday ?? 0;

  return {
    isLoading,
    isPro,
    recordedMsToday: usedMs,
    remainingMs: getRemainingRecordMs(usedMs, isPro),
    canStart: canStartRecording(usedMs, isPro),
  };
}
