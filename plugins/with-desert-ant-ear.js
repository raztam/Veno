const fs = require('fs');
const path = require('path');
const { IOSConfig, withXcodeProject } = require('expo/config-plugins');

const PACKAGE_URL = 'https://github.com/Desert-Ant-Labs/desert-ant-core.git';
const PACKAGE_VERSION = '3.1.0';
const PRODUCT_NAME = 'Ear';
const BRIDGE_FILE_NAME = 'VenoEarBridge.swift';

function alreadyHasPackage(project) {
  const refs = project.hash.project.objects.XCRemoteSwiftPackageReference ?? {};
  return Object.values(refs).some((entry) => entry?.repositoryURL === PACKAGE_URL);
}

function addCommentedReference(list, uuid, comment) {
  if (!Array.isArray(list)) {
    return [{ value: uuid, comment }];
  }

  const exists = list.some((entry) => {
    const value = typeof entry === 'string' ? entry : entry?.value;
    return value === uuid;
  });
  if (exists) {
    return list;
  }

  list.push({ value: uuid, comment });
  return list;
}

function addSwiftPackage(project, projectRoot) {
  if (alreadyHasPackage(project)) {
    return;
  }

  project.hash.project.objects.XCRemoteSwiftPackageReference ||= {};
  project.hash.project.objects.XCSwiftPackageProductDependency ||= {};

  const packageUuid = project.generateUuid();
  const productUuid = project.generateUuid();

  project.hash.project.objects.XCRemoteSwiftPackageReference[packageUuid] = {
    isa: 'XCRemoteSwiftPackageReference',
    repositoryURL: PACKAGE_URL,
    requirement: {
      kind: 'upToNextMajorVersion',
      minimumVersion: PACKAGE_VERSION,
    },
  };
  project.hash.project.objects.XCRemoteSwiftPackageReference[`${packageUuid}_comment`] =
    `XCRemoteSwiftPackageReference "desert-ant-core"`;

  project.hash.project.objects.XCSwiftPackageProductDependency[productUuid] = {
    isa: 'XCSwiftPackageProductDependency',
    package: packageUuid,
    productName: PRODUCT_NAME,
  };
  project.hash.project.objects.XCSwiftPackageProductDependency[`${productUuid}_comment`] = PRODUCT_NAME;

  const projectSection = project.pbxProjectSection();
  const projectKey = Object.keys(projectSection).find((key) => !key.endsWith('_comment'));
  if (projectKey) {
    projectSection[projectKey].packageReferences = addCommentedReference(
      projectSection[projectKey].packageReferences,
      packageUuid,
      'XCRemoteSwiftPackageReference "desert-ant-core"',
    );
  }

  const projectName = IOSConfig.XcodeUtils.getProjectName(projectRoot);
  const appTarget = IOSConfig.XcodeUtils.getApplicationNativeTarget({ project, projectName });
  const nativeTargets = project.pbxNativeTargetSection();
  const target = nativeTargets[appTarget.uuid];
  if (target) {
    target.packageProductDependencies = addCommentedReference(
      target.packageProductDependencies,
      productUuid,
      PRODUCT_NAME,
    );
  }
}

/** @type {import('expo/config-plugins').ConfigPlugin} */
const withDesertAntEar = (config) => {
  config = IOSConfig.XcodeProjectFile.withBuildSourceFile(config, {
    filePath: BRIDGE_FILE_NAME,
    overwrite: true,
    contents: fs.readFileSync(
      path.join(__dirname, '../modules/expo-desert-ant-ear/ios/AppTarget/VenoEarBridge.swift'),
      'utf8',
    ),
  });

  return withXcodeProject(config, (config) => {
    addSwiftPackage(config.modResults, config.modRequest.projectRoot);
    return config;
  });
};

module.exports = withDesertAntEar;
