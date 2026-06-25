import type { PropsWithChildren } from 'react';

import { useAppLock } from '@/features/security/use-app-lock';

export function SecurityProvider({ children }: PropsWithChildren) {
  useAppLock();
  return children;
}
