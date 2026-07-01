const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CMDLINE_TOOLS_URL = {
  darwin: 'https://dl.google.com/android/repository/commandlinetools-mac-13114758_latest.zip',
  linux: 'https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip',
  win32: 'https://dl.google.com/android/repository/commandlinetools-win-13114758_latest.zip',
};

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

function resolveAndroidSdk() {
  if (process.env.ANDROID_HOME) {
    return process.env.ANDROID_HOME;
  }

  if (process.env.ANDROID_SDK_ROOT) {
    return process.env.ANDROID_SDK_ROOT;
  }

  const candidates = [
    path.join(os.homedir(), 'Library/Android/sdk'),
    path.join(os.homedir(), 'Android/Sdk'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    'Android SDK not found. Install Android Studio or set ANDROID_HOME to your SDK path.',
  );
}

function resolveJavaHome() {
  const candidates = [
    '/Applications/Android Studio.app/Contents/jbr/Contents/Home',
    process.env.JAVA_HOME,
    path.join(os.homedir(), 'Library/Java/JavaVirtualMachines'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const javaBinary = path.join(candidate, 'bin', 'java');
    if (fs.existsSync(javaBinary)) {
      return candidate;
    }
  }

  return null;
}

function writeLocalProperties(targetDir, sdkDir) {
  const file = path.join(targetDir, 'local.properties');
  const contents = `sdk.dir=${sdkDir.replace(/\\/g, '\\\\')}\n`;

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(file, contents);
  console.log(`Wrote ${file}`);
}

function compareSemver(a, b) {
  const aParts = a.split('.').map((part) => Number.parseInt(part, 10));
  const bParts = b.split('.').map((part) => Number.parseInt(part, 10));
  const length = Math.max(aParts.length, bParts.length);

  for (let index = 0; index < length; index += 1) {
    const aValue = aParts[index] ?? 0;
    const bValue = bParts[index] ?? 0;

    if (aValue !== bValue) {
      return aValue - bValue;
    }
  }

  return 0;
}

function findInstalledCmakeVersions(sdkDir) {
  const cmakeRoot = path.join(sdkDir, 'cmake');

  if (!fs.existsSync(cmakeRoot)) {
    return [];
  }

  const cmakeBinaryName = process.platform === 'win32' ? 'cmake.exe' : 'cmake';

  return fs
    .readdirSync(cmakeRoot)
    .filter((version) => fs.existsSync(path.join(cmakeRoot, version, 'bin', cmakeBinaryName)))
    .sort(compareSemver);
}

function findSdkmanager(sdkDir) {
  const candidates = [
    path.join(sdkDir, 'cmdline-tools/latest/bin/sdkmanager'),
    path.join(sdkDir, 'cmdline-tools/bin/sdkmanager'),
    path.join(sdkDir, 'tools/bin/sdkmanager'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function sdkEnv(sdkDir) {
  const javaHome = resolveJavaHome();
  const env = {
    ...process.env,
    ANDROID_HOME: sdkDir,
    ANDROID_SDK_ROOT: sdkDir,
  };

  if (javaHome) {
    env.JAVA_HOME = javaHome;
    env.PATH = `${path.join(javaHome, 'bin')}${path.delimiter}${env.PATH ?? ''}`;
  }

  return env;
}

function acceptAndroidLicenses(sdkmanager, sdkDir) {
  console.log('Accepting Android SDK licenses (if needed)...');
  spawnSync('bash', ['-c', `yes | "${sdkmanager}" --licenses`], {
    env: sdkEnv(sdkDir),
    stdio: 'inherit',
  });
}

function ensureCmdlineTools(sdkDir) {
  const existing = findSdkmanager(sdkDir);
  if (existing) {
    return existing;
  }

  const url = CMDLINE_TOOLS_URL[process.platform];
  if (!url) {
    throw new Error(`Unsupported platform for automatic cmdline-tools install: ${process.platform}`);
  }

  console.log('Android SDK Command-line Tools not found. Downloading...');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'veno-android-cmdline-tools-'));
  const zipPath = path.join(tmpDir, 'commandlinetools.zip');
  const extractDir = path.join(tmpDir, 'extract');
  const targetDir = path.join(sdkDir, 'cmdline-tools', 'latest');

  run('curl', ['-fsSL', url, '-o', zipPath]);
  fs.mkdirSync(extractDir, { recursive: true });

  if (process.platform === 'win32') {
    run('tar', ['-xf', zipPath, '-C', extractDir]);
  } else {
    run('unzip', ['-q', zipPath, '-d', extractDir]);
  }

  const extractedToolsDir = path.join(extractDir, 'cmdline-tools');
  if (!fs.existsSync(extractedToolsDir)) {
    throw new Error('Downloaded Android command-line tools archive was missing cmdline-tools/.');
  }

  fs.mkdirSync(path.join(sdkDir, 'cmdline-tools'), { recursive: true });
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.renameSync(extractedToolsDir, targetDir);

  const sdkmanager = findSdkmanager(sdkDir);
  if (!sdkmanager) {
    throw new Error('Failed to install Android SDK Command-line Tools.');
  }

  console.log(`Installed Android SDK Command-line Tools to ${targetDir}`);
  acceptAndroidLicenses(sdkmanager, sdkDir);
  return sdkmanager;
}

function configureHermesCmake(sdkDir, sdkmanager) {
  const preferredVersion = process.env.CMAKE_VERSION || '3.30.5';
  const preferredPath = path.join(sdkDir, 'cmake', preferredVersion);

  if (fs.existsSync(preferredPath)) {
    process.env.CMAKE_VERSION = preferredVersion;
    return preferredVersion;
  }

  const installedVersions = findInstalledCmakeVersions(sdkDir);
  const latestInstalled = installedVersions.at(-1);

  if (latestInstalled && compareSemver(latestInstalled, preferredVersion) >= 0) {
    process.env.CMAKE_VERSION = latestInstalled;
    return latestInstalled;
  }

  console.log(`Installing CMake ${preferredVersion} with sdkmanager...`);
  run(sdkmanager, ['--install', `cmake;${preferredVersion}`], {
    env: sdkEnv(sdkDir),
  });
  process.env.CMAKE_VERSION = preferredVersion;
  return preferredVersion;
}

function ensureAndroidSdkConfigured(projectRoot = path.join(__dirname, '..')) {
  const sdkDir = resolveAndroidSdk();

  writeLocalProperties(path.join(projectRoot, 'android'), sdkDir);
  writeLocalProperties(path.join(projectRoot, 'node_modules/react-native'), sdkDir);

  process.env.ANDROID_HOME = sdkDir;
  process.env.ANDROID_SDK_ROOT = sdkDir;

  const javaHome = resolveJavaHome();
  if (javaHome) {
    process.env.JAVA_HOME = javaHome;
    process.env.PATH = `${path.join(javaHome, 'bin')}${path.delimiter}${process.env.PATH ?? ''}`;
  }

  const sdkmanager = ensureCmdlineTools(sdkDir);
  configureHermesCmake(sdkDir, sdkmanager);

  const sdkmanagerBin = path.dirname(sdkmanager);
  process.env.PATH = `${sdkmanagerBin}${path.delimiter}${process.env.PATH ?? ''}`;

  return sdkDir;
}

if (require.main === module) {
  const projectRoot = path.join(__dirname, '..');
  ensureAndroidSdkConfigured(projectRoot);

  run('./gradlew', ['assembleRelease', '-PreactNativeArchitectures=arm64-v8a'], {
    cwd: path.join(projectRoot, 'android'),
    env: process.env,
  });

  const apkSource = path.join(
    projectRoot,
    'android/app/build/outputs/apk/release/app-release.apk',
  );
  const apkTarget = path.join(projectRoot, 'builds/veno-release.apk');

  fs.mkdirSync(path.dirname(apkTarget), { recursive: true });
  fs.copyFileSync(apkSource, apkTarget);
  console.log(`Copied release APK to ${apkTarget}`);
}

module.exports = {
  ensureAndroidSdkConfigured,
  resolveAndroidSdk,
};
