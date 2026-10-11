import { AppState } from 'react-native';

/** Delay after foreground so device-unlock biometrics can finish before the app prompt. */
export const POST_UNLOCK_AUTH_DELAY_MS = 400;

export function waitForActiveApp(
  signal?: AbortSignal,
  settleDelayMs: number = POST_UNLOCK_AUTH_DELAY_MS,
): Promise<boolean> {
  if (signal?.aborted) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let subscription: { remove: () => void } | null = null;

    const finish = (ready: boolean) => {
      if (settled) {
        return;
      }

      settled = true;
      signal?.removeEventListener('abort', onAbort);

      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }

      subscription?.remove();
      subscription = null;
      resolve(ready && !signal?.aborted);
    };

    const onAbort = () => finish(false);

    const settle = () => {
      if (signal?.aborted) {
        finish(false);
        return;
      }

      if (settleDelayMs <= 0) {
        finish(true);
        return;
      }

      timeout = setTimeout(() => {
        finish(!signal?.aborted);
      }, settleDelayMs);
    };

    signal?.addEventListener('abort', onAbort);

    if (AppState.currentState === 'active') {
      settle();
      return;
    }

    subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        subscription?.remove();
        subscription = null;
        settle();
      }
    });
  });
}
