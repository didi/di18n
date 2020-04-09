/* di18n-disable */
import React from 'react';

class Demo extends React.Component {
  render() {
    return <div>注释忽略翻译</div>;
  }
}
/* di18n-enable */

function func(a, b, c) {
  const t = a + b + c;
  return t;
}

func(
  1,
  '注释忽略翻译', // di18n-disable-line
  3,
  4,
  5
);

function A() {
  const t = '注释忽略翻译';
  return <div>注释忽略翻译 { t }</div>
}

export default Demo;
