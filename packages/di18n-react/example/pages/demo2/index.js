import React from 'react';
import * as di18n from '../../../dist';
import Title3 from './Title';

const { Di18nProvider, getLocale, setLocale, intl } = di18n;

function ChangeLocalBtn() {
  const title = getLocale() === 'zh-CN' ? 'english' : '中文';

  const changeLang = () => {
    setLocale(getLocale() === 'zh-CN' ? 'en-US' : 'zh-CN', {
      cookieLocaleKey: 'di18n',
    });
  };

  return (
    <div>
      <button onClick={changeLang}>{title}</button>
    </div>
  );
}

// locale data
const locales = {
  'en-US': require('../../locales/en-US.json'),
  'zh-CN': require('../../locales/zh-CN.json'),
};

function Title(props) {
  return (
    <div>
      <ChangeLocalBtn />
      <Title3 />
    </div>
  );
}

export default class App extends React.Component {
  render() {
    return (
      <Di18nProvider locales={locales} locale='zh' cookieLocaleKey='di18n' hardReload>
        <Title />
      </Di18nProvider>
    );
  }
}
