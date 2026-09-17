const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { buildReleaseApk, ensureAndroidSdkConfigured } = require('./android-build');

const PACKAGE_NAME = 'com.raztamim.veno';
const APK_RELATIVE_PATH = 'builds/veno-release.apk';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function capture(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const stderr = (result.stderr ?? '').trim();
    throw new Error(stderr || `${command} ${args.join(' ')} failed`);
  }

  return result.stdout ?? '';
}

function resolveAdb(sdkDir) {
  const candidates = [
    path.join(sdkDir, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  const fromPath = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['adb'], {
    encoding: 'utf8',
  });

  if (fromPath.status === 0) {
    const resolved = fromPath.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean);

    if (resolved) {
      return resolved;
    }
  }

  throw new Error(
    'adb not found. Install Android platform-tools or add adb to your PATH.',
  );
}

function listDevices(adb) {
  const output = capture(adb, ['devices', '-l']);

  return output
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, status, ...rest] = line.split(/\s+/);
      return { id, status, details: rest.join(' ') };
    });
}

function pickDevice(devices) {
  const serial = process.env.ANDROID_SERIAL;
  if (serial) {
    const match = devices.find((device) => device.id === serial);
    if (!match) {
      throw new Error(`No device with serial ${serial} is connected.`);
    }

    if (match.status !== 'device') {
      throw new Error(
        `Device ${serial} is ${match.status}. Unlock it and authorize USB debugging.`,
      );
    }

    return match;
  }

  const ready = devices.filter((device) => device.status === 'device');

  if (ready.length === 1) {
    return ready[0];
  }

  if (ready.length > 1) {
    const list = ready.map((device) => `  ${device.id}  ${device.details}`).join('\n');
    throw new Error(
      `Multiple Android devices are connected. Set ANDROID_SERIAL to pick one:\n${list}`,
    );
  }

  const unauthorized = devices.filter((device) => device.status === 'unauthorized');
  if (unauthorized.length > 0) {
    throw new Error(
      'Android device is unauthorized. Unlock the phone and accept the USB debugging prompt.',
    );
  }

  throw new Error(
    'No Android device found. Plug in the phone, enable USB debugging, and tap Allow.',
  );
}

function installAndLaunch(adb, device, apkPath) {
  console.log(`Installing ${path.basename(apkPath)} on ${device.id}...`);
  run(adb, ['-s', device.id, 'install', '-r', '-d', apkPath]);

  console.log(`Launching ${PACKAGE_NAME}...`);
  run(adb, [
    '-s',
    device.id,
    'shell',
    'monkey',
    '-p',
    PACKAGE_NAME,
    '-c',
    'android.intent.category.LAUNCHER',
    '1',
  ]);
}

function main() {
  const skipBuild = process.argv.includes('--skip-build');
  const projectRoot = path.join(__dirname, '..');
  const sdkDir = ensureAndroidSdkConfigured(projectRoot);
  const adb = resolveAdb(sdkDir);
  const device = pickDevice(listDevices(adb));

  console.log(`Using Android device ${device.id}${device.details ? ` (${device.details})` : ''}`);

  const apkPath = skipBuild
    ? path.join(projectRoot, APK_RELATIVE_PATH)
    : buildReleaseApk(projectRoot);

  if (!fs.existsSync(apkPath)) {
    throw new Error(
      `APK not found at ${apkPath}. Run npm run build:android first, or omit --skip-build.`,
    );
  }

  installAndLaunch(adb, device, apkPath);
  console.log('Done.');
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
