const rootPath = require('./rootPath');
const collect = require('../command/collect');

const testConfig = {
  config: `${rootPath}/fixtures/vue/di18n.config.js`,
};

test('should auto extract string works well', () => {
  return collect(testConfig).then(res => {
    // 应该包含两个语言的资源
    expect(res.length).toBe(2);
  });
});
