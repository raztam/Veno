import * as SecureStore from 'expo-secure-store';

const VAULT_LOCK_ENABLED_KEY = 'veno_vault_lock_enabled';

export async function getVaultLockEnabled(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(VAULT_LOCK_ENABLED_KEY);
  if (value === null) {
    return true;
  }

  return value === 'true';
}

export async function setVaultLockEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(VAULT_LOCK_ENABLED_KEY, enabled ? 'true' : 'false');
}
