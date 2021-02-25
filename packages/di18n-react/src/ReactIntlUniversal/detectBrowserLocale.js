function detectBrowserLocale() {
  const locale = navigator.language || '';
  const lang = locale.split(/_|-/)[0];

  // 参考：https://ant.design/docs/react/i18n-cn
  switch (lang) {
    case 'ar': return 'ar-EG';
    case 'az': return 'az-AZ';
    case 'bg': return 'bg-BG';
    case 'by': return 'by-BY';
    case 'ca': return 'ca-ES';
    case 'cs': return 'cs-CZ';
    case 'da': return 'da-DK';
    case 'de': return 'de-DE';
    case 'el': return 'el-GR';
    case 'en': return 'en-US';
    case 'et': return 'et-EE';
    case 'fa': return 'fa-IR';
    case 'fi': return 'fi-FI';
    case 'fr': return 'fr-FR';
    case 'ga': return 'ga-IE';
    case 'gl': return 'gl-ES';
    case 'he': return 'he-IL';
    case 'hi': return 'hi-IN';
    case 'hr': return 'hr-HR';
    case 'hu': return 'hu-HU';
    case 'hy': return 'hy-AM';
    case 'id': return 'id-ID';
    case 'it': return 'it-IT';
    case 'is': return 'is-IS';
    case 'ja': return 'ja-JP';
    case 'kmr': return 'kmr-IQ';
    case 'kn': return 'kn-IN';
    case 'kk': return 'kk-KZ';
    case 'ko': return 'ko-KR';
    case 'lt': return 'lt-LT';
    case 'lv': return 'lv-LV';
    case 'mk': return 'mk-MK';
    case 'mn': return 'mn-MN';
    case 'ms': return 'ms-MY';
    case 'nb': return 'nb-NO';
    case 'ne': return 'ne-NP';
    case 'nl': return 'nl-NL';
    case 'pl': return 'pl-PL';
    case 'pt': return 'pt-PT';
    case 'ro': return 'ro-RO';
    case 'ru': return 'ru-RU';
    case 'sk': return 'sk-SK';
    case 'sr': return 'sr-RS';
    case 'sl': return 'sl-SI';
    case 'sv': return 'sv-SE';
    case 'ta': return 'ta-IN';
    case 'th': return 'th-TH';
    case 'tr': return 'tr-TR';
    case 'uk': return 'uk-UA';
    case 'vi': return 'vi-VN';
    case 'zh': return 'zh-CN';
    default: return 'en-US';
  }
}

export default detectBrowserLocale;
