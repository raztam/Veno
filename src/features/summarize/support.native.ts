import { isAvailable } from 'react-native-executorch';

export function isSummarizeSupported(): boolean {
  return isAvailable;
}
