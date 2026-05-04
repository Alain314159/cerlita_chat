const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 2026 Optimization: Enable CSS support and asset scaling
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: false, // Desactivado para depuración
  },
});

// Support for modern formats and better resolution
config.resolver.assetExts.push('webp');

module.exports = config;
