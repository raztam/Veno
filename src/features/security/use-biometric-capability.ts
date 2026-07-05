import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export type BiometricCapability = {
  isLoading: boolean;
  isAvailable: boolean;
  guidance: string | null;
};

export function useBiometricCapability(): BiometricCapability {
  const [state, setState] = useState<BiometricCapability>({
    isLoading: true,
    isAvailable: false,
    guidance: null,
  });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (Platform.OS === 'web') {
        if (!cancelled) {
          setState({
            isLoading: false,
            isAvailable: false,
            guidance: 'Biometric lock is not available on web.',
          });
        }
        return;
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!cancelled) {
        if (!hasHardware) {
          setState({
            isLoading: false,
            isAvailable: false,
            guidance: 'This device does not support biometric authentication.',
          });
          return;
        }

        if (!isEnrolled) {
          setState({
            isLoading: false,
            isAvailable: false,
            guidance: 'Enable Face ID, Touch ID, or a device passcode in system settings.',
          });
          return;
        }

        setState({
          isLoading: false,
          isAvailable: true,
          guidance: null,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
