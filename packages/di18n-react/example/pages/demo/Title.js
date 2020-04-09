import React from 'react';
import { Di18nTrans, intl } from '../../../dist';

function Title(props) {
  return <div style={{ color: 'red' }}>{props.name}</div>;
}

export default function Title(props) {
  return (
    <div>
      <Di18nTrans i18nKey='tips.noTags' parent='p'>
        暂无标签，请
        <span style={{ fontWeight: 'bold', margin: '0 5px' }} onClick={() => console.log('xxxxx')}>
          添加
        </span>
      </Di18nTrans>
      <div>
        {intl.t('版本号: {version}', {version: '1.2.3'})}
      </div>
    </div>
  );
}
