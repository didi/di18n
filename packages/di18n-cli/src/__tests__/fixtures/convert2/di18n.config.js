const rootPath = require('../../rootPath');

module.exports = {
  entry: `${rootPath}/fixtures/convert2`,
  output: `${rootPath}/fixtures/convert2/dist`,
  disableAutoTranslate: true,
  exclude: ['**/dist/**', '**/*.config.js', '**/*.data.js'],
  keyPrefix: 'app.i18n',
  primaryLocale: 'zh-CN',
  supportedLocales: ['zh-CN', 'en-US'],
};
