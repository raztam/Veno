import { Platform } from 'react-native';

import { devLog } from './dev-logger';

let installed = false;

function isNativeDevice(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

function formatConsoleArgs(args: unknown[]): { message: string; details?: string } {
  if (args.length === 0) {
    return { message: '(empty)' };
  }

  const [first, ...rest] = args;
  const message = typeof first === 'string' ? first : String(first);
  const details = rest.length > 0 ? rest.map((arg) => String(arg)).join(' ') : undefined;

  return { message, details };
}

export function installDevLogger(): void {
  if (!isNativeDevice() || installed) {
    return;
  }

  installed = true;

  const originalConsole = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };

  console.log = (...args: unknown[]) => {
    if ((globalThis as typeof globalThis & { __devLogMirroring?: boolean }).__devLogMirroring) {
      originalConsole.log(...args);
      return;
    }

    const { message, details } = formatConsoleArgs(args);
    devLog.debug('console', message, details);
    originalConsole.log(...args);
  };

  console.info = (...args: unknown[]) => {
    if ((globalThis as typeof globalThis & { __devLogMirroring?: boolean }).__devLogMirroring) {
      originalConsole.info(...args);
      return;
    }

    const { message, details } = formatConsoleArgs(args);
    devLog.info('console', message, details);
    originalConsole.info(...args);
  };

  console.warn = (...args: unknown[]) => {
    if ((globalThis as typeof globalThis & { __devLogMirroring?: boolean }).__devLogMirroring) {
      originalConsole.warn(...args);
      return;
    }

    const { message, details } = formatConsoleArgs(args);
    devLog.warn('console', message, details);
    originalConsole.warn(...args);
  };

  console.error = (...args: unknown[]) => {
    if ((globalThis as typeof globalThis & { __devLogMirroring?: boolean }).__devLogMirroring) {
      originalConsole.error(...args);
      return;
    }

    const { message, details } = formatConsoleArgs(args);
    devLog.error('console', message, details);
    originalConsole.error(...args);
  };

  const errorUtils = (globalThis as typeof globalThis & {
    ErrorUtils?: {
      getGlobalHandler?: () => (error: unknown, isFatal?: boolean) => void;
      setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
    };
  }).ErrorUtils;

  const defaultHandler = errorUtils?.getGlobalHandler?.();

  errorUtils?.setGlobalHandler?.((error, isFatal) => {
    devLog.error('global', isFatal ? 'Fatal error' : 'Unhandled error', error);
    defaultHandler?.(error, isFatal);
  });

  devLog.info('app', 'Debug logger installed');
}
