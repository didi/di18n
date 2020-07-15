const transformTs = require('./transformTs');
const transformJs = require('./transformJs');
const transformVue = require('./transformVue');
const { REACT_JS, REACT_TS, VUE } = require('../utils/constants');

module.exports = function transformDi18n(source, sourceType, localeInfo, options) {
  switch (sourceType) {
    case REACT_JS:
      return transformJs(source, localeInfo, options);
    case REACT_TS:
      return transformTs(source, localeInfo, options);
    case VUE:
      return transformVue(source, localeInfo, options);
    default:
      throw new Error(`Unsupport sourceType: ${sourceType}`);
  }
};
