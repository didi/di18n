const fs = require('fs');
const path = require('path');
const rootPath = require('./rootPath');
const collect = require('../command/collect');

const testConfig = {
  config: `${rootPath}/fixtures/basic/di18n.config.js`,
};

function resetLocale() {
  const localePath = `${rootPath}/fixtures/basic/locales`;

  ['zh-CN', 'en-US'].forEach(name => {
    const locale = JSON.parse(fs.readFileSync(path.join(localePath, name + '.json')));
    if (locale['好的'] || locale['确认'] === '确认') {
      if (locale['好的']) delete locale['好的'];
      locale['确认'] = (name === 'zh-CN' ? '好的' : 'Confirm');
    }

    fs.writeFileSync(path.join(localePath, name + '.json'), JSON.stringify(locale, '', 2));
  });
}

test('should auto extract string works well', () => {
  resetLocale();

  return collect(testConfig).then(res => {
    // 应该包含两个语言的资源
    expect(res.length).toBe(2);

    console.log(res);

    const enKeys = Object.keys(res[0].locales);
    const cnKeys = Object.keys(res[1].locales);

    // 两个语言各自的资源数应该一致
    expect(cnKeys.length).toBe(enKeys.length);

    // 如果配置中以及有翻译，应该使用配置中的翻译
    expect(res[0].locales['标题']).toBe('title');
    expect(res[0].locales['标题{context, SUMMARY}']).toBe('Summary Title');

    // 如果中文在配置中被修改，则应该使用新的中文为 key，同时修改非中文的 key
    // 确认 --> 好的
    expect(cnKeys).not.toContain('确认');
    expect(cnKeys).toContain('好的');
    expect(enKeys).not.toContain('确认');
    expect(enKeys).toContain('好的');

    // 英文只是变 key，Value 保持不变
    expect(res[0].locales['好的']).toBe('Confirm');

    // 注意如果修改了测试用数据，这里要跟着修改为预期的数字
    expect(cnKeys.length).toBe(13);
  });
});
