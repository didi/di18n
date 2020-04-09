import { intl, setLocale, Di18nProvider } from 'di18n-react';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import Logo from './EFE-logo.png';
import enUS from '../locales/en-US.json';
import zhCN from '../locales/zh-CN.json';

const locales = {
  'en-US': enUS,
  'zh-CN': zhCN,
};

function changeLang(key) {
  setLocale(key, {
    cookieLocaleKey: 'lang',
  });
}

function App() {
  return (
    <div className="app">
      <img src={Logo} />
      <h1>React-di18n</h1>
      <p>Happy coding here ~</p>

      <div>
        <button onClick={() => changeLang('zh-CN')}>
          {
            '中文' // di18n-disable-line
          }
        </button>
        <button onClick={() => changeLang('en-US')}>English</button>
      </div>
      <p>{intl.t('中文')}</p>
    </div>
  );
}

ReactDOM.render(
  <Di18nProvider locales={locales}>
    <App />
  </Di18nProvider>,
  document.getElementById('root')
);
