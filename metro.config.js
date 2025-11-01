const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('onnx')) {
  config.resolver.assetExts.push('onnx');
}

if (!config.resolver.assetExts.includes('data')) {
  config.resolver.assetExts.push('data');
}

// Configure path alias for @ to resolve to project root
config.resolver.extraNodeModules = {
  '@': __dirname,
};

module.exports = config;
