import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useSecurity } from '@/features/security/use-security';

export function useSecurityGate() {
  const router = useRouter();
  const { isUnlocked } = useSecurity();

  useEffect(() => {
    if (!isUnlocked) {
      router.replace('/(lock)/lock');
    }
  }, [isUnlocked, router]);
}
