const { getDefaultConfig } = require('expo/metro-config');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(__dirname, {
  getDefaultConfig: (projectRoot, options) => {
    const expoConfig = getDefaultConfig(projectRoot, options);

    expoConfig.resolver.sourceExts.push('sql');
    expoConfig.resolver.assetExts.push('bin', 'mil', 'pte');
    expoConfig.resolver.extraNodeModules = {
      ...expoConfig.resolver.extraNodeModules,
      buffer: require.resolve('buffer'),
    };

    return expoConfig;
  },
});

module.exports = config;
