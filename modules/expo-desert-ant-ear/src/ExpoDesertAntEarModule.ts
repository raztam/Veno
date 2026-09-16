import { NativeModule, requireOptionalNativeModule } from 'expo';

import type { EarDetection } from './ExpoDesertAntEar.types';

declare class ExpoDesertAntEarModule extends NativeModule {
  isDownloaded(): boolean;
  download(): Promise<void>;
  identify(fileUri: string): Promise<EarDetection>;
}

export default requireOptionalNativeModule<ExpoDesertAntEarModule>('ExpoDesertAntEar');
