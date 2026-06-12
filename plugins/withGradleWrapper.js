const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withGradleWrapper(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const wrapperPath = path.join(
        config.modRequest.platformProjectRoot,
        'gradle/wrapper/gradle-wrapper.properties'
      );
      if (fs.existsSync(wrapperPath)) {
        const content = fs.readFileSync(wrapperPath, 'utf8');
        const updated = content.replace(
          /distributionUrl=https\\:\/\/services\.gradle\.org\/distributions\/gradle-[^-]+-bin\.zip/,
          'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.13-bin.zip'
        );
        fs.writeFileSync(wrapperPath, updated);
      }
      return config;
    },
  ]);
};
