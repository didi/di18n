# 使用示例

::: tip
本章节的用法，一般需要手工干预。
:::

## Di8nTrans 

`Di8nTrans` 组件可以处理需要在文案中集成一些带有样式的、可交互的 React 节点的场景。

比如 「暂无标签，请 **添加**」 我们希望点击「添加」后触发自定义的行为。

一般来说我们的代码可能是像下面这样：

```jsx
import React from 'react';

export default function Demo(props) {
  return (
    <span>
      暂无标签，请
      <span style={{ fontWeight: 'bold'}} onClick={() => console.log('xxxxx')}>
        添加
      </span>
    </span>
  );
}
```

为了 `sync` 命令能够准确的判断出这种情况，需要引入 `Di18nTrans` 组件:

```jsx
import React from 'react';
import { Di18nTrans } from 'di18n-react';

export default function Demo(props) {
  return (
    <Di18nTrans i18nKey='tips.noTags2' parent='span'>
      暂无标签，请
      <span style={{ fontWeight: 'bold', margin: '0 5px' }} onClick={() => console.log('xxxxx')}>
        添加
      </span>
    </Di18nTrans>
  );
}
```

需要注意以下两点：

- 需要手工指定 i18nKey，并保证全局唯一性
- 通过 `parent` 属性指定渲染后的元素，如果不指定则默认为 `div`

代码改造完毕后， 再次 `sync` 后，会得到类似下面的文案资源:

```json
{
  "tips.noTags2": "暂无标签，请<1>添加</1>"
}
```

**文案中的 `<1></1>` 可以理解为占位符，在文案管理时，请不要对这些占位符做任何修改！！**

## Context

利用 context 处理相同中文对应不同翻译的情况。 `intl.t` 方法第二个参数为字符串时，表示当前文案的 context，如下面的代码示例

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

| key                    | 翻译 |
| ---------------------- | ---- |
| 新建                   | New  |
| 新建{context, capital} | NEW  |

## Plural

一般用于处理不同数量下展示不同的文案。

```js
intl.t('你有 {num, plural, =0 {0 张照片} =1 {1 张照片} other {# 张照片}}', {num: 100000});
// 你有 100,000 张照片

intl.t('You have {num, plural, =0 {no photos.} =1 {one photo.} other {# photos.}}', {num: 1});
// You have one photo.
```

## Select 

根据参数选择不同的分支。

```js
intl.t('充值 - {method, select, ALIPAY {支付宝} COUPON {礼品券} BANK {银行卡}}', { method: 'ALIPAY' });
// 充值 - 支付宝
```

# 货币

```js
intl.t('售价 {price, number, CNY}', {price: 123456.78});
// 售价 ￥123,456.78

intl.t('The price is {price, number, USD}', {price: 123456.78});
// The price is $123,456.78
```

用法格式为 `{name, type, format}` :

- `name` 是消息的变量名，上面的例子中，就是 `price`
- `type` 是值的类型，比如可以是 `number`、 `date` 和 `time`
- `format` 是可选的，是用于控制展示格式的额外信息

如果类型是 `number` 同时省略了 `format`，那么默认将以[千分号分隔符](https://docs.oracle.com/cd/E19455-01/806-0169/overview-9/index.html)展示数据，如果 `format` 是[货币](https://www.currency-iso.org/en/home/tables/table-a1.html)的一种，那么将会展示为相应的货币格式。

## 日期

```js
intl.t('开始时间 {start, date, short}', {start: new Date()});
// 开始时间 19/4/21
intl.t('开始时间 {start, date, medium}', {start: new Date()});
// 开始时间 2019年4月21日
intl.t('开始时间 {start, date, long}', {start: new Date()});
// 开始时间 2019年4月21日
intl.t('开始时间 {start, date, full}', {start: new Date()});
// 开始时间 2019年4月21日星期日

intl.t('Start date is {start, date, short}', {start: new Date()});
// Start date is 4/21/19
intl.t('Start date is {start, date, medium}', {start: new Date()});
// Start date is Apr 21, 2019
intl.t('Start date is {start, date, long}', {start: new Date()});
// Start date is April 21, 2019
intl.t('Start date is {start, date, full}', {start: new Date()});
// Start date is Sunday, April 21, 2019
```

If type is `date`, `format` has the following values:

- `short` shows date as shortest as possible
- `medium` shows short textual representation of the month
- `long` shows long textual representation of the month
- `full` shows dates with the most detail


## 时间

```js
intl.t('过期时间 {expires, time, short}', {expires: new Date()});
// 过期时间 上午1:36
intl.t('过期时间 {expires, time, medium}', {expires: new Date()});
// 过期时间 上午1:36:10
intl.t('过期时间 {expires, time, long}', {expires: new Date()});
// 过期时间 GMT+8 上午1:36:10

intl.t('Coupon expires at {expires, time, short}', {expires: new Date()});
// Coupon expires at 1:37 AM
intl.t('Coupon expires at {expires, time, medium}', {expires: new Date()});
// Coupon expires at 1:37:39 AM
intl.t('Coupon expires at {expires, time, long}', {expires: new Date()});
// Coupon expires at 1:37:39 AM GMT+8
```

if type is `time`, `format` has the following values:

- `short` shows times with hours and minutes
- `medium` shows times with hours, minutes, and seconds
- `long` shows times with hours, minutes, seconds, and timezone