jest.mock('whisper.rn', () => require('whisper.rn/jest-mock'));

jest.mock('expo-video-audio-extractor', () => ({
  extractAudio: jest.fn(async ({ output }: { output: string }) => output),
}));
