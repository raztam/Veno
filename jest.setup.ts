jest.mock('whisper.rn', () => require('whisper.rn/jest-mock'));

jest.mock('react-native-executorch', () => ({
  initExecutorch: jest.fn(),
  isAvailable: false,
  models: { llm: { lfm2_5_1_2b_instruct: jest.fn(() => ({})) } },
  useLLM: jest.fn(() => ({
    isReady: false,
    isGenerating: false,
    downloadProgress: 0,
    response: '',
    error: null,
    generate: jest.fn(),
    getGeneratedTokenCount: jest.fn(() => 0),
  })),
}));

jest.mock('react-native-background-actions', () => ({
  __esModule: true,
  default: {
    isRunning: jest.fn(() => false),
    start: jest.fn(async (task: () => Promise<void>) => task()),
    stop: jest.fn(),
    updateNotification: jest.fn(),
  },
}));

jest.mock('expo-video-audio-extractor', () => ({
  extractAudio: jest.fn(async ({ output }: { output: string }) => output),
}));
