const rootPath = require('./rootPath');
const collect = require('../command/collect');

const testConfig = {
  config: `${rootPath}/fixtures/ignore/di18n.config.js`,
};

test('it should ignore components specified in ignoreComponents', () => {
  return collect(testConfig).then(res => {
    // 应该包含两个语言的资源
    expect(res.length).toBe(2);

    const cnKeys = Object.keys(res[0].locales);
    const enKeys = Object.keys(res[1].locales);

    // 两个语言各自的资源数应该一致
    expect(cnKeys.length).toBe(enKeys.length);

    // 应该包含 4 个资源，
    // 注意如果修改了测试用数据，这里要跟着修改为预期的数字
    expect(cnKeys.length).toBe(4);
  });
});

test('it should ingore lines marked by comment di18n-disable(-line)', () => {
  return collect(testConfig).then(res => {
    expect(res[0].locales['注释忽略翻译']).toBe('注释忽略翻译');
  });
});
