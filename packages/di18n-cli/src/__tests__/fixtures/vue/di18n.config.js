const rootPath = require('../../rootPath');

module.exports = {
  entry: `${rootPath}/fixtures/vue`,
  output: `${rootPath}/fixtures/vue/dist`,
  disableAutoTranslate: true,
  exclude: ['**/dist/**', '**/*.config.js', '**/*.data.js'],
  keyPrefix: 'app.i18n',
  primaryLocale: 'zh-CN',
  supportedLocales: ['zh-CN', 'en-US'],
  localeConf: {
    type: 'file',
    folder: `${rootPath}/fixtures/vue/locales`
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
