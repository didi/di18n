const rootPath = require('../../rootPath');

module.exports = {
  entry: `${rootPath}/fixtures/ignore`,
  output: `${rootPath}/fixtures/ignore/dist`,
  disableAutoTranslate: true,
  ignoreComponents: ['EventTracker'],
  ignoreMethods: ['MirrorTrack', 'TaoTie.trackUserClickEvent'],
  exclude: ['**/dist/**', '**/*.config.js', '**/*.data.js'],
  keyPrefix: 'app.i18n',
  primaryLocale: 'zh-CN',
  supportedLocales: ['zh-CN', 'en-US'],
  localeConf: {
    type: 'file',
    folder: `${rootPath}/fixtures/ignore/locales`
  }
};
