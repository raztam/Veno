export const RETRYABLE_NETWORK_ERROR =
  /socket|connection abort|connection reset|timed out|timeout|network|unable to resolve|econnreset|econnaborted|enetunreach/i;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRetryableNetworkError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : String(error);

  return RETRYABLE_NETWORK_ERROR.test(message);
}

export function normalizeProgress(progress: number): number {
  return Math.max(0, Math.min(100, Math.round(progress)));
}
