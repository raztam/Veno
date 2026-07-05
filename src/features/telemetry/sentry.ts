import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() ?? '';

let initialized = false;

export function isSentryEnabled(): boolean {
  return Boolean(dsn);
}

export function initSentry(): void {
  if (initialized || !dsn) {
    return;
  }

  Sentry.init({
    dsn,
    debug: __DEV__,
    tracesSampleRate: __DEV__ ? 1 : 0.2,
    enableAutoSessionTracking: true,
    integrations: [
      Sentry.reactNativeTracingIntegration({
        traceFetch: true,
      }),
      Sentry.expoRouterIntegration(),
    ],
  });

  Sentry.setTag('app.platform', Platform.OS);
  Sentry.setTag('app.version', Constants.expoConfig?.version ?? 'unknown');

  initialized = true;
}

export function captureTelemetryError(
  error: unknown,
  feature: string,
  context?: Record<string, string | number | boolean | null>,
): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.withScope((scope) => {
    scope.setTag('feature', feature);

    if (context) {
      scope.setContext(feature, context);
    }

    Sentry.captureException(error);
  });
}

export { Sentry };
