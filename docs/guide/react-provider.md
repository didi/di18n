# Di18nProvider

`Di18nProvider` 用于提供自动拉取、缓存配置资源，并封装了 `react-intl-universal` 的初始化方法。

### 参数

| 属性名            | 类型                | 说明                                                                                                                                  | 默认值 |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `ns`              | string              |  Apollo 配置的空间名称，必选项                                                                                                        | 无     |
| `env`             | `dev` `test` `prod` | 环境说明                                                                                                                              | test   |
| `version`         | `string`            | 版本号，可以为空，也可以从当前 package.json 中读取，解决旧版本的代码还在运行时，配置读取问题。**注意：如果 env = dev 则会忽视版本号** | 无     |
| `urlLocaleKey`    | string              | URL 中用于标识语言的关键字                                                                                                            | lang   |
| `cookieLocaleKey` | string              | Cookie 中用于标识语言的关键字                                                                                                         | lang   |
| `noCache`         | boolean             | 是否禁用 localstorage 缓存                                                                                                            | false  |

- 如果 `urlLocaleKey` 和 `cookieLocaleKey` 都没有指定的话， 则将自动根据浏览器进行判断。
- 如果同时指定了 `urlLocaleKey` 和 `cookieLocaleKey` 的话， 则以 `urlLocaleKey` 为准。

### 安装

```shell
$ npm install di18n-react
```

### 使用示例

```jsx {9}
import React from 'react';
import { Di18nProvider } from 'di18n-react';

import App from './app';

export default class DI18NApp extends React.Component {
  render() {
    return (
      <Di18nProvider ns="di18n-demo" env="test">
        <App />
      </Di18nProvider>
    );
  }
}
```

::: tip
`Di18nProvider` 只能有个一个子节点，并且该子节点将自动拥有 `locale` 属性。
:::
