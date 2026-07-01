const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

const SERVICE_NAME = 'com.asterinet.react.bgactions.RNBackgroundActionsTask';

/** @type {import('expo/config-plugins').ConfigPlugin} */
const withModelDownloadService = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;

    AndroidConfig.Permissions.ensurePermissions(manifest, [
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_DATA_SYNC',
      'android.permission.POST_NOTIFICATIONS',
    ]);

    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    const services = mainApplication.service ?? [];

    const serviceIndex = services.findIndex((entry) => {
      const name = entry.$?.['android:name'];
      return name === SERVICE_NAME || name === '.RNBackgroundActionsTask';
    });

    if (serviceIndex >= 0) {
      services[serviceIndex].$['android:foregroundServiceType'] = 'dataSync';
    } else {
      services.push({
        $: {
          'android:name': SERVICE_NAME,
          'android:foregroundServiceType': 'dataSync',
        },
      });
    }

    mainApplication.service = services;

    return config;
  });
};

module.exports = withModelDownloadService;
