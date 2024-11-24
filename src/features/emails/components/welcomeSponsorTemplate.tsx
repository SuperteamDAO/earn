import React from 'react';

import { PDTG } from '@/constants';

import { styles } from '../utils';

export const WelcomeSponsorTemplate = () => {
  return (
    <div style={styles.container}>
      <p style={styles.text}> 欢迎来到 Solar Earn !</p>
      <p style={styles.textWithMargin}>
        感谢您的注册，Solar Earn 是一站式自助申请 Solana
        生态项目的赏金任务平台，连接 Solana 华语区人才和项目方，做任务，赢赏金！
      </p>
      <p style={styles.textWithMargin}>
        您在Solar Earn 上设置您的列表时需要任何帮助，请随时联系&nbsp;
        <a href={PDTG} style={styles.link}>
          Vesper
        </a>{' '}
        on Telegram.&nbsp;
      </p>
      <p style={styles.salutation}>
        祝好,
        <br />
        Solar Earn
      </p>
    </div>
  );
};
