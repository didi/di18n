@observer
class TitlePanel extends React.Component<{}, {}> {
  render() {
    return (
      <div>
        <h1>{`单价：${store.goods.price},数量：${store.goods.number},总价${store.total}`}</h1>
        <button
          onClick={() => {
            store.changePrice();
          }}>
          {'点击改变单价'}
        </button>
      </div>
    );
  }
}
ReactDom.render(<TitlePanel />, document.body);
