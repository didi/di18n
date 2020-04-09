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

function Title(props) {
  return (
    <div>
      <ChangeLocalBtn />
      <Title3 />
    </div>
  );
}

class Title2 extends React.Component {
  render() {
    return (
      <div>
        <ChangeLocalBtn />
        <h1>{intl.get('app.newService.deploymentInfo').d('部署信息')}</h1>
      </div>
    );
  }
}


export default class App extends React.Component {
  render() {
    const loading = <span>loading...</span>;
    return (
      <Di18nProvider ns='di18n-demo' cookieLocaleKey='di18n' hardReload timeout={2000} placeholder={loading}>
        <Title />
      </Di18nProvider>
    );
  }
}
