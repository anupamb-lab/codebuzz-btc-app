const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    blockList: [
      // Exclude unnecessary directories to reduce file watchers
      /node_modules\/.*\/android\/.*/,
      /node_modules\/.*\/ios\/.*/,
      /node_modules\/.*\/\.git\/.*/,
      /node_modules\/.*\/docs\/.*/,
      /node_modules\/.*\/example\/.*/,
      /node_modules\/.*\/examples\/.*/,
      /node_modules\/.*\/test\/.*/,
      /node_modules\/.*\/tests\/.*/,
      /node_modules\/.*\/spec\/.*/,
      /node_modules\/.*\/\.vscode\/.*/,
      /node_modules\/.*\/\.idea\/.*/,
      /node_modules\/react-native-fbsdk-next\/lib\/.*/,
      /node_modules\/react-native-fbsdk-next\/src\/.*/,
      /node_modules\/react-native-reanimated\/lib\/.*/,
      /node_modules\/react-native-reanimated\/src\/.*/,
    ],
  },
  watchFolders: [],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
