# Whisper models

Veno downloads the multilingual `ggml-base.bin` model on first transcription into the app document directory (`models/`).

Bundling a `.bin` file here is optional. If you bundle one, add Metro asset extensions (`bin`, `mil`) and pass it to `initWhisper({ filePath: require('./ggml-base.bin') })`.

Do not use English-only (`.en`) models — they cannot auto-detect or transcribe other languages.
