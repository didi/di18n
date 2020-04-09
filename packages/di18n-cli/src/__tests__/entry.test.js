const rootPath = require('./rootPath');
const collect = require('../command/collect');

const testConfig = {
  config: `${rootPath}/fixtures/entry/di18n.config.js`,
};

test('it should support multi entries', () => {
  return collect(testConfig).then(res => {
    // 应该包含两个语言的资源
    expect(res.length).toBe(2);

    const cnKeys = Object.keys(res[0].locales);
    const enKeys = Object.keys(res[1].locales);

    // 两个语言各自的资源数应该一致
    expect(cnKeys.length).toBe(enKeys.length);

    // 应该包含 n 个资源，
    // 注意如果修改了测试用数据，这里要跟着修改为预期的数字
    expect(cnKeys.length).toBe(4);
  });
});
