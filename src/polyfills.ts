import { Buffer } from 'buffer';
import { Platform } from 'react-native';

import { installDevLogger } from '@/features/telemetry/install-dev-logger';
import { initSentry } from '@/features/telemetry/sentry';

declare const global: typeof globalThis & {
  Buffer?: typeof Buffer;
};

if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

initSentry();

if (Platform.OS === 'ios' || Platform.OS === 'android') {
  installDevLogger();
}
