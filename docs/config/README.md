# 配置

配置文件为项目根目录下的 **di18n.config.js**，这里介绍所有的配置项目。

## entry

* Type: `String` | `Array`
* Default: `src`

代码扫描的入口。默认为 `src` 目录。

如果设置为数组，则支持多入口，比如：

```js
{
  entry: ['packages/feature1/src', 'packages/feature2/src'],
}
```

## exclude

* Type: `Array`
* Default: `[]`

代码扫描时，被排除的文件。详情参考 [glob 设置](https://github.com/isaacs/node-glob#glob-primer)。

比如设置为 `exclude: ['**/*.test.{js,jsx}']` 将会排除掉项目中的测试代码。

## output

* Type: `String` | `Array`

将字符串替换后代码的保存目录，如果不设置，则为 entry 指定的目录，即会覆盖原文件。

需要注意的是，如果上面的 `entry` 设置为了数组，则 `output` 也必须相应的设置为数组，并和 entry 中的元素一一对应。比如：

```js
{
  entry: ['packages/feature1/src', 'packages/feature2/src'],
  output: ['packages/feature1/dist', 'packages/feature2/dist']
}
```

## disableAutoTranslate

* Type: `Boolean`
* Default: `false`

是否禁用默认的 google 翻译服务，如果不想使用自动翻译或者存在网络问题时，可以将该选项设置为 true。

## translator

* Type: `String` | `null`
* Default: `null`

自定义翻译器路径，比如：`../translate/google.js`，为 `null` 时表示使用默认的 google 翻译器。

## ignoreComponents

* Type: `Array`
* Default: `[]`

React 独有配置，扫描代码时忽略的组件名，可用于需要忽略某些组件的属性不需要被翻译的情况。比如:

配置了 `ignoreComponents: ['EventTracker']` 后，下面源码中 `EventTracker` 组件的 `action` 属性将会在扫描时被忽略。

```jsx
 <EventTracker action="点击_在线客服">
  <Button>{intl.get('app.i18n.ZmnpFkDqc').d('遇到了问题？')</Button>
 </EventTracker>
```

## ignoreMethods

* Type: `Array`
* Default: `[]`

扫描代码时忽略的方法名，可用于需要忽略某些方法的参数不需要被翻译的情况。比如:

配置了 `ignoreMethods: ['MirrorTrack', 'TaoTie.trackUserClickEvent'],` 后，下面源码中用于事件上报的方法参数在扫描时将会被忽略。

```jsx
handleClick = () => {
  // 直接调用的形式
  MirrorTrack('搜索', '点击_搜索按钮');

  // 调用对象方法的形式
  TaoTie.trackUserClickEvent('点击_搜索按钮');

  // 深层调用对象方法的形式
  Sdk.TaoTie.trackUserClickEvent('点击_搜索按钮');

  DoSearch();
};
```

对于对象成员方法，配置中只需要最近一级即可，参考上面代码示例中的「深层调用对象方法的形式」。

注意，只会对方法参数生效，类似下面的代码中 `event` 的值将同样会被扫描和替换:

```jsx
handleClick = () => {
  // 同样将会被扫描和替换
  const event = '点击_搜索按钮';

  TaoTie.trackUserClickEvent(event);
};
```

## primaryLocale

* Type: `String`
* Default: `zh-CN`

> 无需手动修改

主语言 key。

## supportedLocales

* Type: `Array`
* Default: `['zh-CN', 'en-US']`

> 无需手动修改

支持的语言列表。

## importCode

* Type: `String`
* Default: `import { intl } from 'di18n-react';`

引入 `i18nObject` 的代码。

## i18nObject

* Type: `String`
* Default: `intl`

intl 对象的别名，默认为 `intl`。

比如如果设置为了 `reactIntl` 那么生成的代码如下所示：

```jsx
import { intl as reactIntl } from 'di18n-react';

reactIntl.get('key1').d('标题');
```

## i18nMethod

* Type: `String`
* Default: `t`

`i18nObject` 用于国际化的方法，比如 i18nObject='intl', i18nMethod='t' 时，国际化标记为：`intl.t('key1').d('标题')`。

## prettier

* Type: `Object`
* Default: `{ parser: 'babel', singleQuote: true, trailingComma: 'es5' }`

用于输出代码风格的格式化。

## localeConf

* Type: `Object`
* Default: `{ type: 'file' }`

用于自定义国际化资源存储服务，type='file' 表示使用本地文件，type 不为 file 时需指定 `path`，比如:

```js
{
  localeConf: {
    type: 'apollo',
    path: '../conf/ApolloConf.js'
    // 其他信息
  }
}
```

## ignoreComments

以上是 di18n.config.js 的配置，此外，在代码中使用注释 `di18n-disable`/`di18n-enable` 或 `di18n-disable-line`，可以忽略对该代码块或代码行的翻译转换。例如，下面代码的中文将不被翻译。

```jsx
/* di18n-disable */
class Demo extends React.Component {
  render() {
    return <div>注释忽略翻译</div>;
  }
}
/* di18n-enable */
```

```jsx
class Demo extends React.Component {
  render() {
    return <div>注释忽略翻译</div>; // di18n-disable-line
  }
}
```
