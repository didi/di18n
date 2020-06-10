import Cookie from 'js-cookie';

export { default as VueI18n } from 'vue-i18n';

let _cookieLocaleKey = 'lang';

class VueIntl {
  i18n = null;

  /**
   * @param i18n VueI18n instance, https://github.com/kazupon/vue-i18n
   */
  init(i18n) {
    this.i18n = i18n;
  }

  t(...args) {
    if (this.i18n) {
      return this.i18n.t(...args);
    }

    return args[0] || '';
  }

  $t(...args) {
    return this.t(...args);
  }
}

export const intl = new VueIntl();

export function getLocale(cookieLocaleKey) {
  if (cookieLocaleKey) _cookieLocaleKey = cookieLocaleKey;

  let locale = Cookie.get(_cookieLocaleKey)
  if (locale) return locale;

  locale = navigator.language || '';
  return locale.includes('en') ? 'en-US' : 'zh-CN';
}

export function setLocale(locale, hardReload, cookieLocaleKey) {
  if (cookieLocaleKey) _cookieLocaleKey = cookieLocaleKey;

  intl.i18n.locale = locale;
  Cookie.set(_cookieLocaleKey, locale);

  if (hardReload) location.reload();
}
