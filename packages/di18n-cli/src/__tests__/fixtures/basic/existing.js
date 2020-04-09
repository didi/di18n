import { intl } from 'di18n-react';
import React from 'react';

const config = {
  api: 'xxxx',

  title: 'eeee',
  test: true,
};

export default function Test() {
  const a = 10;

  const b = 20;

  const c = 30;

  return (
    <>
      {/* this is a comment in JSX */}
      <Button>标题</Button>
      <Button>{intl.t('标题', 'SUMMARY')}</Button>

      <Button>{intl.t('新建')}</Button>
      <Button>{intl.t('新建', 'TAB')}</Button>

      <Button>{intl.t('确认')}</Button>
    </>
  );
}
