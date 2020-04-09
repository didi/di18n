# react-intl-universal

对于 React 技术栈，我们推荐使用 [react-intl-universal](https://github.com/alibaba/react-intl-universal)

> di18n-react 内部封装了这个库

## 相比于 `react-intl`，它主要有以下优点:

1. 可用于任意 js 文件中，不仅仅局限于 React 组件内部

2. 使用 `injectIntl` 后，你的 React 组件将会被另一个类包起来，会导致一些行为不符合预期，比如为了获取用一个组件实例，下面的代码将不能正常工作：

```jsx
@injectIntl
class MyComponent {...}

class App {
  render() {
    <MyComponent ref="my"/>
  }
  getMyInstance() {
    console.log('getMyInstance', this.refs.my);
  }
}
```

我们需要使用 `getWrappedInstance` 方法：

```jsx {9}
class MyComponent {...}
export default injectIntl(MyComponent, {withRef: true});

class App {
  render() {
    <MyComponent ref="my"/>
  }
  getMyInstance() {
    console.log('getMyInstance', this.refs.my.getWrappedInstance());
  }
}
```