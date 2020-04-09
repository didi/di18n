# API 文档

## Di18nProvider

`Di18nProvider` 用于提供自动拉取、缓存配置资源，并封装了 react-intl-universal 的初始化方法。

### 属性列表

| 属性名 | 类型 | 说明 | 必选 | 默认值 |
| ----- | --- | ---- | --- | ----- |
| `locales`| object | 语言配置 | 是 | 无 |
| `urlLocaleKey` | string | URL 中用于标识语言的关键字 | 否 | lang |
| `cookieLocaleKey` | string | Cookie 中用于标识语言的关键字 | 否 | lang |
| `hardReload` | boolean | 切换语言时是否强刷页面 | 否 | false |
| `placeholder` | JSXElement | 语言未加载前占位 | 否 | null |
| `children` | JSXElement | 应用的根组件 | 是 | 无 |

当前语言的优先级是 `urlLocaleKey` > `cookieLocaleKey`。

### 使用示例

```js
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
```

## intl.t(key, context, variables)

代码中的国际化标记。

### 参数列表

| 参数名 | 类型 | 说明 | 必选 | 默认值 |
| ----- | --- | ---- | --- | ----- |
| key | string | 国际化标记 | 是 | 无 |
| context | string | 用于解决同一中文对应不同翻译 | 否 | 无 |
| variables | object | 模板变量，在存在变量的短句中使用 | 否 | 无 |

context 使用示例如下：

```js
import React from 'react';
import { intl } from 'di18n-react';

export default function Title(props) {
  return (
    <div>
      <p>{intl.t('新建')}</p>
      <p>{intl.t('新建', 'capital')}</p>
    </div>
  );
}
```

将会自动生成两个 key，在英文版本里，可以对应不同的翻译：

| key | 翻译 |
| ----| --- |
| 新建                   | New  |
| 新建{context, capital} | NEW  |

## setLocale(locale, options)

切换语言。

| 参数名 | 类型 | 说明 | 必选 | 默认值 |
| ----- | --- | ---- | --- | ----- |
| locale | 'zh-CN' \| 'en-US' | 切换语言 | 是 | 否 |
| options | object | 国际化配置 | 否 | {} |

### options

| key | 类型 | 说明 | 必选 | 默认值 |
| ----- | --- | ---- | --- | ----- |
| urlLocaleKey | string | URL 中用于标识语言的关键字 | 否 | lang |
| cookieLocaleKey | string | Cookie 中用于标识语言的关键字 | 否 | lang |

`urlLocaleKey` 和 `cookieLocaleKey` 按需提供，因为在改变语言时，如果使用的是 url 或 cookie 来记录当前语言，这些也应该被修改。

## getLocale()

返回当前语言，'zh-CN'、'en-US' 或者其他。

## Trans

TODO:
