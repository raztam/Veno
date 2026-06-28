/** Multilingual Whisper model — do not use `.en`-only variants. */
export const WHISPER_MODEL_FILENAME = 'ggml-base.bin';

export const WHISPER_MODEL_URL =
  'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin';

/** ggml-base.bin is ~142 MB; reject obvious partial downloads below this threshold. */
export const WHISPER_MODEL_MIN_BYTES = 100_000_000;

export const WHISPER_MODEL_DOWNLOAD_MAX_ATTEMPTS = 3;
export const WHISPER_MODEL_DOWNLOAD_BASE_DELAY_MS = 2_000;
