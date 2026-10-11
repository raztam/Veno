import { NativeModule, registerWebModule } from 'expo';

import type { EarDetection } from './ExpoDesertAntEar.types';

class ExpoDesertAntEarModule extends NativeModule {
  isDownloaded(): boolean {
    return false;
  }

  async download(): Promise<void> {}

  async identify(_fileUri: string): Promise<EarDetection> {
    return { language: null, confidence: 0, isReliable: false };
  }
}

export default registerWebModule(ExpoDesertAntEarModule, 'ExpoDesertAntEar');
