class Store {
  @observable goods: any = { price: 20, number: 100 };
  @computed get total() {
    let name = '你好';
    return this.goods.price * this.goods.number;
  }
  @action changePrice() {
    let title = '世界';
    this.goods.price = Math.floor(Math.random() * 100);
  }
}
const store = new Store();
