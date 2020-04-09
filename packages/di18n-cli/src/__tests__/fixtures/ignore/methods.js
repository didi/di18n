import React from 'react';
import TaoTie from '@/utils/TaoTie';
import MirrorTrack from '@/utils/MirrorTrack';
import Sdk from '@/utils/Sdk';

const test1 = new RegExp('你好');
const test2 = /你好/;

class ExpIntro extends React.PureComponent {
  handleClick = () => {
    // 直接调用的形式
    MirrorTrack('搜索', '点击_搜索按钮');

    // 调用对象方法的形式
    TaoTie.trackUserClickEvent('点击_搜索按钮');

    // 深层调用对象方法的形式
    Sdk.TaoTie.trackUserClickEvent('点击_搜索按钮');

    DoSearch();
  };

  render() {
    return (
      <div className='bottom-nav'>
        <Button onclick={this.handleClick}>搜索</Button>
      </div>
    );
  }
}

export default ExpIntro;
