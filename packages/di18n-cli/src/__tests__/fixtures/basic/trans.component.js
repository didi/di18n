import React from 'react';
import { Di18nTrans } from 'di18n-react';

export default function Demo(props) {
  return (
    <div>
      <Di18nTrans i18nKey="tips.noTags2" parent="div">
        暂无标签，请
        <span
          style={{ fontWeight: 'bold', margin: '0 5px' }}
          onClick={() => console.log('xxxxx')}>
          添加
        </span>
        然后 <Title name="新的文案">刷新页面</Title>
      </Di18nTrans>
    </div>
  );
}
