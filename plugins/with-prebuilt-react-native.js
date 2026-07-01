const { withSettingsGradle } = require('expo/config-plugins');

const INCLUDE_BUILD_BLOCK =
  /includeBuild\(expoAutolinking\.reactNative\) \{\s*dependencySubstitution \{[\s\S]*?\}\s*\}\s*/g;

/** @type {import('expo/config-plugins').ConfigPlugin} */
const withPrebuiltReactNative = (config) => {
  return withSettingsGradle(config, (config) => {
    config.modResults.contents = config.modResults.contents.replace(INCLUDE_BUILD_BLOCK, '');
    return config;
  });
};

module.exports = withPrebuiltReactNative;
