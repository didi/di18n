const rootPath = require('../../rootPath');

module.exports = {
  entry: `${rootPath}/fixtures/convert'`,
  output: `${rootPath}/fixtures/convert/dist`,
  disableAutoTranslate: true,
  exclude: ['**/dist/**', '**/*.config.js', '**/*.data.js'],
  keyPrefix: 'app.i18n',
  locales: `${rootPath}/fixtures/convert/locales`,
  primaryLocale: 'zh-CN',
  supportedLocales: ['zh-CN', 'en-US'],
  prettier: {
    singleQuote: false,
    trailingComma: 'es5',
    jsxBracketSameLine: true,
    printWidth: 100,
    jsxSingleQuote: true,
  },
};
