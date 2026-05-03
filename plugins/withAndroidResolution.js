const { withProjectBuildGradle } = require('@expo/config-plugins');

const withAndroidResolution = (config) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = addResolutionStrategy(config.modResults.contents);
    }
    return config;
  });
};

function addResolutionStrategy(content) {
  const resolutionStrategy = `
        configurations.all {
            resolutionStrategy {
                force 'com.google.android.gms:play-services-ads-identifier:18.0.1'
                force 'com.google.android.gms:play-services-basement:18.3.0'
                force 'com.google.android.gms:play-services-base:18.3.0'
                force 'com.google.android.gms:play-services-tasks:18.1.0'
            }
        }
`;

  if (content.includes('configurations.all')) {
    return content;
  }

  // Insert before allprojects or at the end
  if (content.includes('allprojects {')) {
    return content.replace('allprojects {', `allprojects {${resolutionStrategy}`);
  }
  
  return content + resolutionStrategy;
}

module.exports = withAndroidResolution;
