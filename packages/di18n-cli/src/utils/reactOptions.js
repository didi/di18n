// default options
module.exports = {
  // source path, <string array>
  // e.g. ['src']
  entry: ['src'],

  // exclude pattern, <string array>
  // e.g. ['**/dist/**', '**/*.config.js', '**/*.data.js']
  exclude: [],

  // output path, <string array>
  // e.g. ['dist']
  output: ['src'], // default i18n in place

  // auto translate flag, <boolean>
  // e.g. true
  disableAutoTranslate: true,

  // only extract locales, not touch source code, <boolean>
  // e.g. true
  extractOnly: false,

  // translator, <null | string>
  // null: default google translator
  // e.g. ../translate/google.js
  translator: null,

  // ignored components, <string array>
  // e.g. ['EventTracker']
  ignoreComponents: [],

  // ignored methods, <string array>
  // e.g. ['MirrorTrack']
  ignoreMethods: [],

  // XXX: json loose
  // primaryRegx: /[\u4e00-\u9fa5]/,

  // primary locale, <string>
  // e.g. 'zh-CN'
  primaryLocale: 'zh-CN',

  // supported locales, <string array>
  // e.g. ['zh-CN', 'en-US']
  supportedLocales: ['zh-CN', 'en-US'],

  // import codes, <string>
  // e.g. "import { intl } from 'di18n-react';"
  importCode: "import { intl } from 'di18n-react';",

  // i18n object, <string>
  // e.g. 'intl'
  i18nObject: 'intl',

  // i18n method, <string>
  // e.g. 't'
  i18nMethod: 't',

  // prettier conf, <null | object>
  // e.g. {}
  prettier: {
    singleQuote: true,
    trailingComma: 'es5',
    endOfLine: 'lf',
  },

  // i18n saving conf, <object>
  // if localeConf.type !== 'file', localeConf.path is required
  // e.g. { type: 'apollo', path: '../conf/ApolloConf.js', ... }
  localeConf: {
    type: 'file',
    // others...
  },
};
