import * as Device from 'expo-device';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export type AuthFailureReason =
  | 'unavailable'
  | 'not_enrolled'
  | 'cancelled'
  | 'failed'
  | 'unknown';

export type AuthResult =
  | { success: true }
  | { success: false; reason: AuthFailureReason };

export async function authenticateUser(): Promise<AuthResult> {
  if (Platform.OS === 'web') {
    return { success: true };
  }

  // Simulators often have no passcode / Face ID settings — skip in dev only.
  if (__DEV__ && !Device.isDevice) {
    return { success: true };
  }

  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware) {
    return { success: false, reason: 'unavailable' };
  }

  if (!isEnrolled) {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    if (level === LocalAuthentication.SecurityLevel.NONE) {
      return { success: false, reason: 'not_enrolled' };
    }
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock Veno',
    promptSubtitle: 'Verify your identity to access your notes',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });

  if (result.success) {
    return { success: true };
  }

  switch (result.error) {
    case 'user_cancel':
    case 'system_cancel':
    case 'app_cancel':
      return { success: false, reason: 'cancelled' };
    case 'not_enrolled':
    case 'not_available':
    case 'passcode_not_set':
      return { success: false, reason: 'not_enrolled' };
    case 'authentication_failed':
      return { success: false, reason: 'failed' };
    default:
      return { success: false, reason: 'unknown' };
  }
}
