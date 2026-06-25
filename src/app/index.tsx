import { Redirect } from 'expo-router';

import { useSecurity } from '@/features/security/use-security';

export default function Index() {
  const { isUnlocked } = useSecurity();

  if (isUnlocked) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Redirect href="/(lock)/lock" />;
}
