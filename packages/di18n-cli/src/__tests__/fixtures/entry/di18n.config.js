const rootPath = require('../../rootPath');

module.exports = {
  entry: [`${rootPath}/fixtures/entry/src1`, `${rootPath}/fixtures/entry/src2`],
  output: [`${rootPath}/fixtures/entry/src1/dist`, `${rootPath}/fixtures/entry/src2/dist`],
  disableAutoTranslate: true,
  ignoreComponents: ['EventTracker'],
  exclude: ['**/dist/**', '**/*.config.js', '**/*.data.js'],
  keyPrefix: 'app.i18n',
  primaryLocale: 'zh-CN',
  supportedLocales: ['zh-CN', 'en-US'],
  localeConf: {
    type: 'file',
    folder: `${rootPath}/fixtures/entry/locales`
  }
};
