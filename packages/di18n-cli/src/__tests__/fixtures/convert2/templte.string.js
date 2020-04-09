import { intl } from 'di18n-react';

const max = 100;
const message = intl.get('app.i18n.iiioopppppp', {
  max: max,
}).d('输入框文字已经超出 {max}，按 ENTER 将以文字发送');
