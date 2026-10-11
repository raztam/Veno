import * as Device from 'expo-device';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

import { useSecurityStore } from '@/features/security/security-store';

export type AuthFailureReason =
  | 'unavailable'
  | 'not_enrolled'
  | 'cancelled'
  | 'interrupted'
  | 'failed'
  | 'unknown';

export type AuthResult =
  | { success: true }
  | { success: false; reason: AuthFailureReason };

let authenticateInFlight: Promise<AuthResult> | null = null;

export function isSilentAuthFailure(reason: AuthFailureReason): boolean {
  return reason === 'interrupted';
}

export async function authenticateUser(options?: {
  promptMessage?: string;
  promptSubtitle?: string;
}): Promise<AuthResult> {
  if (authenticateInFlight) {
    return authenticateInFlight;
  }

  authenticateInFlight = runAuthenticate(options).finally(() => {
    authenticateInFlight = null;
  });

  return authenticateInFlight;
}

async function runAuthenticate(options?: {
  promptMessage?: string;
  promptSubtitle?: string;
}): Promise<AuthResult> {
  const { setAuthenticating } = useSecurityStore.getState();
  setAuthenticating(true);

  try {
    return await promptForAuthentication(options);
  } finally {
    setAuthenticating(false);
  }
}

async function promptForAuthentication(options?: {
  promptMessage?: string;
  promptSubtitle?: string;
}): Promise<AuthResult> {
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
    promptMessage: options?.promptMessage ?? 'Unlock Veno',
    promptSubtitle: options?.promptSubtitle ?? 'Verify your identity to access your notes',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });

  if (result.success) {
    return { success: true };
  }

  switch (result.error) {
    case 'user_cancel':
      return { success: false, reason: 'cancelled' };
    case 'system_cancel':
    case 'app_cancel':
      return { success: false, reason: 'interrupted' };
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
