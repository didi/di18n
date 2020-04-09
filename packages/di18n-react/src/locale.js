function setCookie(cookieName, value, exdays) {
  const exdate = new Date();
  exdate.setDate(exdate.getDate() + exdays);
  const cookieValue = escape(value) + (exdays == null ? '' : '; expires=' + exdate.toUTCString());
  document.cookie = cookieName + '=' + cookieValue + ';path=/';
}

function getLocale() {
  return window.g_di18n_lang;
}

/**
 * 设置语言
 * @param {string} options.urlLocaleKey URL's query Key to determine locale. Example: if URL=http://localhost?lang=en-US, then set it 'lang'
 * @param {string} options.cookieLocaleKey Cookie's Key to determine locale. Example: if cookie=lang:en-US, then set it 'lang'
 */
function setLocale(lang, options = {}) {
  if (lang !== undefined && !/^([a-z]{2})-([A-Z]{2})$/.test(lang)) {
    // for reset when lang === undefined
    throw new Error('setLocale lang format error');
  }

  if (getLocale() === lang) return;

  let { urlLocaleKey, cookieLocaleKey } = options;
  let url = window.document.location.href;

  if (urlLocaleKey) {
    const query = document.location.search
      .replace('?', '')
      .split('&')
      .filter(item => item !== '')
      .reduce((prev, cur) => {
        const [key, value] = cur.split('=');
        prev[key] = value;
        return prev;
      }, {});

    query[urlLocaleKey] = lang;
    url = url.split('?')[0] + '?' + Object.keys(query).map(key => `${key}=${query[key]}`).join('&');
    window.document.location.replace(url);
  } else {
    cookieLocaleKey = cookieLocaleKey || 'lang';

    setCookie(cookieLocaleKey, lang, 360);

    if (window.g_di18n_hard_reload) {
      window.document.location.replace(url);
    } else if (typeof window.g_di18n_reload_locale === 'function') {
      window.g_di18n_reload_locale();
    }
  }
}

export { setLocale, getLocale };
