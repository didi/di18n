const rootPath = require('../../rootPath');

module.exports = {
  entry: `${rootPath}/fixtures/basic`,
  output: `${rootPath}/fixtures/basic/dist`,
  disableAutoTranslate: true,
  exclude: ['**/dist/**', '**/*.config.js', '**/*.data.js'],
  keyPrefix: 'app.i18n',
  primaryLocale: 'zh-CN',
  supportedLocales: ['zh-CN', 'en-US'],
  localeConf: {
    type: 'file',
    folder: `${rootPath}/fixtures/basic/locales`
  },
  prettier: {
    parser: 'babel',
    singleQuote: true,
    trailingComma: 'es5',
    eslintIntegration: false,
    printWidth: 100,
    jsxBracketSameLine: true,
  },
};
