const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 웹 빌드 시 react-native-maps를 stub으로 대체
// react-native-maps는 iOS/Android 전용 네이티브 모듈로, 웹에서 사용 불가
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'react-native-maps-web-stub.js'),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
