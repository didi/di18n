const rootPath = require('./rootPath');
const convert = require('../command/convert');

const testConfig = {
  config: `${rootPath}/fixtures/convert/di18n.config.js`,
};

test('convert to intl-universal works well', () => {
  const res = convert(testConfig); // eslint-disable-line no-unused-vars
});
