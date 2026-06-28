/** Multilingual Whisper model — do not use `.en`-only variants. */
export const WHISPER_MODEL_FILENAME = 'ggml-small.bin';

export const WHISPER_MODEL_URL =
  'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin';

/** Human-readable label for settings / logs. */
export const WHISPER_MODEL_LABEL = 'Whisper Small (multilingual)';

/** ggml-small.bin is ~466 MiB; reject obvious partial downloads below this threshold. */
export const WHISPER_MODEL_MIN_BYTES = 400_000_000;

export const WHISPER_MODEL_DOWNLOAD_MAX_ATTEMPTS = 3;
export const WHISPER_MODEL_DOWNLOAD_BASE_DELAY_MS = 2_000;
