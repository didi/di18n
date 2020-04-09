import { intl } from 'di18n-react';
import React from 'react';

export default function Test() {
  return (
    <div>
      <Button>{intl.get('app.i18n.dfjeifjeife').d('联系人')}</Button>      
    </div>
  );
}
