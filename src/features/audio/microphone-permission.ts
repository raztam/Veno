import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import { Linking } from 'react-native';

export type MicrophonePermissionResult =
  | { granted: true }
  | { granted: false; reason: 'denied' }
  | { granted: false; reason: 'blocked' };

export async function ensureMicrophonePermission(): Promise<MicrophonePermissionResult> {
  const current = await getRecordingPermissionsAsync();
  if (current.granted) {
    return { granted: true };
  }

  const requested = await requestRecordingPermissionsAsync();
  if (requested.granted) {
    return { granted: true };
  }

  if (requested.canAskAgain === false) {
    return { granted: false, reason: 'blocked' };
  }

  return { granted: false, reason: 'denied' };
}

export function openAppSettings(): void {
  void Linking.openSettings();
}
