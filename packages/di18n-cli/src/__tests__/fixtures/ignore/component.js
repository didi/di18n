import React from 'react';
import EventTracker from '@/components/EventTracker';

class ExpIntro extends React.PureComponent {
  render() {
    return (
      <div className="bottom-nav">
        <EventTracker action="在线客服">
          <a href="dingtalk://dingtalkclient/action/sendmsg?dingtalk_id=apollozhushou">
            <img src="/static/images/apollozhushou.png" />
            <div className="tip">
              <p>遇到了问题？</p>
              <p>点击图标，钉钉『Apollo小助手』为您快速解答</p>
            </div>
          </a>
        </EventTracker>
      </div>
    );
  }
}

export default ExpIntro;
