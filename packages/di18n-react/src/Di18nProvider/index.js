import React from 'react';
import intl from '../ReactIntlUniversal';
import { langKeysMapping } from './utils';

export default class Di18nProvider extends React.Component {
  state = { initDone: false, locale: '' };

  /**
   * can use this method to pevent warning messages when dev
   */
  static preInit = () => {
    intl.init({
      currentLocale: 'zh-CN',
      warningHandler: message => {
        const options = intl.getInitOptions();

        if (!options.locales['zh-CN'] || options.locales['zh-CN'].length > 0) {
          console.warn(message);
        }
      },
      locales: {
        'zh-CN': [],
      },
    });
  };

  componentDidMount() {
    this.loadLocales();

    window.g_di18n_reload_locale = () => {
      this.loadLocales();
    };

    if (this.props.hardReload) {
      window.g_di18n_hard_reload = true;
    }
  }

  loadLocales() {
    const { urlLocaleKey, cookieLocaleKey, locale, locales } = this.props;

    let currentLocale = null;

    if (locale) {
      // locale 用于端应用，不支持切换语言
      currentLocale = locale;
    } else {
      currentLocale = intl.determineLocale({
        urlLocaleKey: urlLocaleKey || 'lang',
        cookieLocaleKey: cookieLocaleKey || 'lang',
      });
    }

    console.log('currentLocale', currentLocale);

    currentLocale = langKeysMapping[locale] || currentLocale;

    console.log('currentLocale', currentLocale);

    if (!/^([a-z]{2})-([A-Z]{2})$/.test(currentLocale)) {
      console.warn('locale format error,  use format like zh-CN, but got ' + currentLocale);
    }

    window.g_di18n_lang = currentLocale;

    if (locales) {
      this.loadLocalesFromFile(currentLocale);
    }
  }

  loadLocalesFromFile = currentLocale => {
    const { locales } = this.props;

    intl
      .init({
        currentLocale,
        locales,
      })
      .then(() => {
        this.setState({ initDone: true, locale: currentLocale });
      });
  };

  render() {
    const { placeholder = null } = this.props;

    if (!this.state.initDone) {
      return placeholder;
    }

    const children = React.Children.only(this.props.children);

    return React.cloneElement(
      children,
      {
        ...this.props,
        locale: this.state.locale,
      },
      this.props.children.props.children
    );
  }
}
