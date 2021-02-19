/*!
 * Mostly vendor code
 * Original code by Alibaba (BSD)
 * https://github.com/alibaba/react-intl-universal/blob/master/src/ReactIntlUniversal.js
 */

/* eslint-disable */

import IntlPolyfill from 'intl';
import React from 'react';
import IntlMessageFormat from 'intl-messageformat';
import escapeHtml from 'escape-html';
import cookie from 'cookie';
import queryParser from 'querystring';
import load from 'load-script';
import invariant from 'invariant';
import 'console-polyfill';
import * as constants from './constants';
import merge from 'lodash.merge';
import isElectron from 'is-electron';

const isBrowser =
  !isElectron() &&
  !!(typeof window !== 'undefined' && window.document && window.document.createElement);

String.prototype.defaultMessage = String.prototype.d = function(msg) {
  return this || msg || '';
};

function isReactElement(item) {
  return !!(item && item.$$typeof);
}

class ReactIntlUniversal {
  constructor() {
    this.options = {
      currentLocale: null, // Current locale such as 'en-US'
      urlLocaleKey: null, // URL's query Key to determine locale. Example: if URL=http://localhost?lang=en-US, then set it 'lang'
      cookieLocaleKey: null, // Cookie's Key to determine locale. Example: if cookie=lang:en-US, then set it 'lang'
      locales: {}, // app locale data like {"en-US":{"key1":"value1"},"zh-CN":{"key1":"值1"}}
      warningHandler: console.warn.bind(console), // ability to accumulate missing messages using third party services like Sentry
      escapeHtml: true, // disable escape html in variable mode
      fallbackLocale: null, // Locale to use if a key is not found in the current locale
    };

    this.keysCache = {};
  }

  // XXX: react-intl-univeral PR，支持 context
  t(message, ...args) {
    let context = '';
    let variables = null;

    if (args.length === 2) {
      context = args[0];
      variables = args[1];
    } else if (args.length === 1) {
      if (typeof args[0] === 'string') {
        context = args[0];
      } else {
        variables = args[0];
      }
    }

    // 处理 jsx
    if (
      variables &&
      Object.values(variables).some(item => isReactElement(item))
    ) {
      const { locales, currentLocale } = this.options;
      const value = locales[currentLocale][message];

      if (!value) return message;
      return this.formatElement(value, variables);
    }

    const key = context ? `${message}{context, ${context}}` : message;
    return this.get(key, variables).d(message);
  }

  /**
   * Get the formatted message by key
   * @param {string} key The string representing key in locale data file
   * @param {Object} variables Variables in message
   * @returns {string} message
   */
  get(key, variables) {
    invariant(key, 'key is required');
    const { locales, currentLocale, formats } = this.options;

    if (!locales || !locales[currentLocale]) {
      console.warn(
        `react-intl-universal locales data "${currentLocale}" not exists.`
      );
      return '';
    }
    let msg = this.getDescendantProp(locales[currentLocale], key);
    if (msg == null) {
      if (this.options.fallbackLocale) {
        msg = this.getDescendantProp(locales[this.options.fallbackLocale], key);
        if (msg == null) {
          console.warn(
            `react-intl-universal key "${key}" not defined in ${currentLocale} or the fallback locale, ${
              this.options.fallbackLocale
            }`
          );
          if (!variables) {
            return '';
          }

          msg = key;
        }
      } else {
        console.warn(
          `react-intl-universal key "${key}" not defined in ${currentLocale}`
        );
        if (!variables) {
          return '';
        }

        msg = key;
      }
    }
    if (variables) {
      variables = Object.assign({}, variables);
      // HTML message with variables. Escape it to avoid XSS attack.
      for (let i in variables) {
        let value = variables[i];
        if (
          this.options.escapeHtml === true &&
          (typeof value === 'string' || value instanceof String) &&
          value.indexOf('<') >= 0 &&
          value.indexOf('>') >= 0
        ) {
          value = escapeHtml(value);
        }
        variables[i] = value;
      }
    }

    try {
      const msgFormatter = new IntlMessageFormat(msg, currentLocale, formats);
      return msgFormatter.format(variables);
    } catch (err) {
      console.warn(
        `react-intl-universal format message failed for key='${key}'.`,
        err.message
      );
      return msg;
    }
  }

  /**
   * Get the formatted html message by key.
   * @param {string} key The string representing key in locale data file
   * @param {Object} variables Variables in message
   * @returns {React.Element} message
   */
  getHTML(key, variables) {
    let msg = this.get(key, variables);
    if (msg) {
      const el = React.createElement('span', {
        dangerouslySetInnerHTML: {
          __html: msg,
        },
      });
      // when key exists, it should still return element if there's defaultMessage() after getHTML()
      const defaultMessage = () => el;
      return Object.assign({ defaultMessage: defaultMessage, d: defaultMessage }, el);
    }
    return '';
  }

  /**
   * As same as get(...) API
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.defaultMessage
   * @param {Object} variables Variables in message
   * @returns {string} message
   */
  formatMessage(messageDescriptor, variables) {
    const { id, defaultMessage } = messageDescriptor;
    return this.get(id, variables).defaultMessage(defaultMessage);
  }

  /**
   * As same as getHTML(...) API
   * @param {Object} options
   * @param {string} options.id
   * @param {React.Element} options.defaultMessage
   * @param {Object} variables Variables in message
   * @returns {React.Element} message
   */
  formatHTMLMessage(messageDescriptor, variables) {
    const { id, defaultMessage } = messageDescriptor;
    return this.getHTML(id, variables).defaultMessage(defaultMessage);
  }

  /**
   * Helper: determine user's locale via URL, cookie, and browser's language.
   * You may not this API, if you have other rules to determine user's locale.
   * @param {string} options.urlLocaleKey URL's query Key to determine locale. Example: if URL=http://localhost?lang=en-US, then set it 'lang'
   * @param {string} options.cookieLocaleKey Cookie's Key to determine locale. Example: if cookie=lang:en-US, then set it 'lang'
   * @returns {string} determined locale such as 'en-US'
   */
  determineLocale(options = {}) {
    return (
      this.getLocaleFromURL(options) ||
      this.getLocaleFromCookie(options) ||
      this.getLocaleFromBrowser()
    );
  }

  /**
   * Initialize properties and load CLDR locale data according to currentLocale
   * @param {Object} options
   * @param {string} options.currentLocale Current locale such as 'en-US'
   * @param {string} options.locales App locale data like {"en-US":{"key1":"value1"},"zh-CN":{"key1":"值1"}}
   * @returns {Promise}
   */
  init(options = {}) {
    invariant(options.currentLocale, 'options.currentLocale is required');
    invariant(options.locales, 'options.locales is required');

    this.load(options.locales);

    this.options.currentLocale = options.currentLocale;
    this.options.formats = Object.assign({}, this.options.formats, constants.defaultFormats);

    return new Promise(resolve => {
      // not load commonLocaleDataUrls anymore
      resolve();
    });
  }

  /**
   * Get the inital options
   */
  getInitOptions() {
    return this.options;
  }

  /**
   * Load more locales after init
   */
  load(locales) {
    merge(this.options.locales, locales);
  }

  getLocaleFromCookie(options) {
    const { cookieLocaleKey } = options;
    if (cookieLocaleKey) {
      let params = cookie.parse(document.cookie);
      return params && params[cookieLocaleKey];
    }
  }

  getLocaleFromURL(options) {
    const { urlLocaleKey } = options;
    if (urlLocaleKey) {
      let query = location.search.split('?');
      if (query.length >= 2) {
        let params = queryParser.parse(query[1]);
        return params && params[urlLocaleKey];
      }
    }
  }

  getDescendantProp(locale, key) {
    if (locale[key]) {
      return locale[key];
    }

    const msg = key.split('.').reduce(function(a, b) {
      return a != undefined ? a[b] : a;
    }, locale);

    return msg;
  }

  getLocaleFromBrowser() {
    const lang = navigator.language || navigator.userLanguage;

    // XXX: support other languages later
    return lang.includes('en') ? 'en-US' : 'zh-CN';
  }

  formatElement(tpl, obj) {
    const result = [], stack = [];
    let pushing = false;

    for (let i = 0; i < tpl.length; i++) {
      if (tpl[i] === '}' && stack.length > 0) {
        let key = []
        while (stack.length > 0) {
          const c = stack.pop()
          if (c === '{') break;

          key.push(c);
        }

        if (stack.length > 0) {
          result.push({ type: 'text', value: stack.join('') });
          stack.splice(0, stack.length);
        }

        key = key.reverse().join('').trim();

        if (key) {
          result.push({ type: 'variable', value: key})
        }

        pushing = false;
      } else if (tpl[i] === '{') {
        stack.push(tpl[i]);
        pushing = true;
      } else if (pushing) {
        stack.push(tpl[i]);
      } else {
        if (
          result.length === 0
          || result[result.length - 1].type !== 'text'
        ) {
          result.push({ type: 'text', value: ''});
        }

        result[result.length - 1].value += tpl[i];
      }
    }

    return (
      <React.Fragment>
        {result.map((item, idx) => {
          return <React.Fragment key={idx}>
            {item.type === 'text' ? item.value : obj[item.value]}
          </React.Fragment>
        })}
      </React.Fragment>
    )
  }
}

const instance = new ReactIntlUniversal();
export default instance;
