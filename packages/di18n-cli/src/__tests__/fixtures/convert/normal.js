import { intl } from 'di18n-react';
import React from 'react';

export default function Test() {
  const { buildData = {} } = this.props;
  const { buildDataSummary = {} } = buildData;
  const {
    buildAvgDuration,
    buildCount,
    buildFailCount,
    buildFailRate,
    buildSuccessCount,
    buildSuccessRate,
  } = buildDataSummary;
  const { formatMessage } = intl;
  let data = [
    {
      value: buildFailCount,
      name: intl.get('intl.chart.build.fail').d('失败'),
    },
    {
      value: buildSuccessCount,
      name: intl.get('intl.chart.build.success').d('成功'),
    },
  ];

  return data;
}
