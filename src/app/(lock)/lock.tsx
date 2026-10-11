import { useRouter, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  isSilentAuthFailure,
  type AuthFailureReason,
} from '@/features/security/authenticate';
import { useSecurityStore } from '@/features/security/security-store';
import { useSecurity } from '@/features/security/use-security';
import {
  POST_UNLOCK_AUTH_DELAY_MS,
  waitForActiveApp,
} from '@/features/security/wait-for-active-app';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function getFailureMessage(reason: AuthFailureReason) {
  switch (reason) {
    case 'unavailable':
      return 'Biometric authentication is not available on this device.';
    case 'not_enrolled':
      return 'Set up a screen lock or biometrics on your device to use Veno.';
    case 'cancelled':
      return 'Authentication was cancelled. Try again to access your notes.';
    case 'failed':
      return 'Authentication failed. Try again.';
    default:
      return 'Unable to unlock. Try again.';
  }
}

export default function LockScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { authenticate, isAuthenticating } = useSecurity();
  const vaultLockEnabled = useSecurityStore((state) => state.vaultLockEnabled);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPreparingUnlock, setIsPreparingUnlock] = useState(false);
  const unlockAttemptRef = useRef(0);
  const unlockInFlightRef = useRef(false);
  const waitingForActiveRef = useRef(false);

  const attemptUnlock = useCallback(
    async (options?: { auto?: boolean; signal?: AbortSignal }) => {
      if (vaultLockEnabled === false) {
        router.replace('/(app)/(tabs)');
        return;
      }

      if (unlockInFlightRef.current || options?.signal?.aborted) {
        return;
      }

      unlockInFlightRef.current = true;
      const attemptId = ++unlockAttemptRef.current;
      setIsPreparingUnlock(true);
      setErrorMessage(null);

      try {
        waitingForActiveRef.current = true;
        const ready = await waitForActiveApp(
          options?.signal,
          options?.auto ? POST_UNLOCK_AUTH_DELAY_MS : 0,
        );
        waitingForActiveRef.current = false;

        if (!ready || attemptId !== unlockAttemptRef.current) {
          return;
        }

        const result = await authenticate();

        if (attemptId !== unlockAttemptRef.current) {
          return;
        }

        if (result.success) {
          router.replace('/(app)/(tabs)');
          return;
        }

        if (isSilentAuthFailure(result.reason)) {
          return;
        }

        setErrorMessage(getFailureMessage(result.reason));
      } finally {
        waitingForActiveRef.current = false;
        if (attemptId === unlockAttemptRef.current) {
          unlockInFlightRef.current = false;
          setIsPreparingUnlock(false);
        }
      }
    },
    [authenticate, router, vaultLockEnabled],
  );

  useFocusEffect(
    useCallback(() => {
      if (vaultLockEnabled === false) {
        router.replace('/(app)/(tabs)');
        return;
      }

      const controller = new AbortController();
      void attemptUnlock({ auto: true, signal: controller.signal });

      return () => {
        controller.abort();

        if (!waitingForActiveRef.current) {
          return;
        }

        unlockAttemptRef.current += 1;
        unlockInFlightRef.current = false;
        waitingForActiveRef.current = false;
        setIsPreparingUnlock(false);
      };
    }, [attemptUnlock, router, vaultLockEnabled]),
  );

  const isUnlocking = isPreparingUnlock || isAuthenticating;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={[styles.iconWrap, { backgroundColor: theme.backgroundElement }]}>
            <SymbolView
              name={{
                ios: 'lock.shield.fill',
                android: 'lock',
                web: 'lock',
              }}
              size={48}
              tintColor={theme.tint}
            />
          </View>

          <ThemedText style={styles.title} type="title">
            Veno
          </ThemedText>
          <ThemedText style={styles.subtitle} themeColor="textSecondary" type="subtitle">
            Your notes are locked
          </ThemedText>
          <ThemedText style={styles.description} themeColor="textSecondary">
            {Platform.OS === 'web'
              ? 'Biometrics are not available on web. Continue to open your vault.'
              : 'Use your fingerprint, face, or device passcode to unlock.'}
          </ThemedText>

          {errorMessage ? (
            <ThemedText style={styles.error} themeColor="error">
              {errorMessage}
            </ThemedText>
          ) : null}

          <Button
            fullWidth
            label={isUnlocking ? 'Verifying…' : 'Unlock'}
            loading={isUnlocking}
            onPress={() => {
              void attemptUnlock();
            }}
            size="lg"
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 25,
  },
  description: {
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  error: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  button: {
    marginTop: Spacing.sm,
  },
});
