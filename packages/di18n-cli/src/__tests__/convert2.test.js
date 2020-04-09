const rootPath = require('./rootPath');
const convert2 = require('../command/convert2');

const testConfig = {
  config: `${rootPath}/fixtures/convert2/di18n.config.js`,
};

test('convert to intl.t works well', () => {
  const res = convert2(testConfig);

  const keys = Object.keys(res);

  expect(keys.length).toBe(2);
});
