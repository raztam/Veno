declare module 'whisper.rn' {
  export type TranscribeFileOptions = {
    language?: string;
    maxThreads?: number;
    onProgress?: (progress: number) => void;
  };

  export type TranscribeResult = {
    result: string;
    language: string;
  };

  export class WhisperContext {
    transcribe(
      filePathOrBase64: string | number,
      options?: TranscribeFileOptions,
    ): {
      stop: () => Promise<void>;
      promise: Promise<TranscribeResult>;
    };
  }

  export type ContextOptions = {
    filePath: string | number;
  };

  export function initWhisper(options: ContextOptions): Promise<WhisperContext>;
}

declare module 'whisper.rn/jest-mock';
