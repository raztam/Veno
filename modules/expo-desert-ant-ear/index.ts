// Re-export the native module. On web, it will be resolved to ExpoDesertAntEarModule.web.ts
// and on native platforms to ExpoDesertAntEarModule.ts
export { default } from './src/ExpoDesertAntEarModule';
export * from './src/ExpoDesertAntEar.types';
