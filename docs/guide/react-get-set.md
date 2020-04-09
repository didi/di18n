# 获取、设置当前语言

`di18n-react` 提供 `getLocale` 和 `setLocale` 两个方法，分别用来获取和设置当前语言。常用来**实现切换语言按钮**。

### 安装

```shell
$ npm install di18n-react
```
### getLocale

`getLocale()`

调用后返回类似  `en-US` 的语言 key。

### setLocale

`setLocale(key, option)` 

- key 想要设置的新语言，注意必须是类似 `en-US` 的全写
- option.urlLocaleKey URL QueryString 中确定语言的 key，比如： 如果 `URL=http://localhost?lang=en-US` 那么设置为 `lang`
- option.cookieLocaleKey Cookie 中确定语言的 key， 比如： 如果 `cookie=lang:en-US` 那么设置为 `lang`

### 代码示例

```jsx
import React from 'react';
import { Dropdown, Menu, Icon } from 'antd';
import { getLocale, setLocale } from 'di18n-react';

export default class SelectLang extends React.PureComponent {
  changeLang = ({ key }) => {
    setLocale(key, {
      cookieLocaleKey: 'lang',
    });
  };

  render() {
    const selectedLang = getLocale();

    const locales = ['zh-CN', 'en-US'];
    const languageLabels = {
      'zh-CN': '简体中文',
      'en-US': 'English',
    };

    const languageIcons = {
      'zh-CN': '🇨🇳',
      'en-US': '🇬🇧',
    };

    const langMenu = (
      <Menu selectedKeys={[selectedLang]} onClick={this.changeLang}>
        {locales.map(locale => (
          <Menu.Item key={locale}>
            <span role="img" aria-label={languageLabels[locale]}>
              {languageIcons[locale]}
            </span>{' '}
            {languageLabels[locale]}
          </Menu.Item>
        ))}
      </Menu>
    );

    return (
      <Dropdown overlay={langMenu}>
        <Icon type="global" style={{ color: '#eee', fontSize: 24, cursor: 'pointer' }} />
      </Dropdown>
    );
  }
}

```
