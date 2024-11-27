import React from 'react';

import { styles } from '../utils';

export const WelcomeTalentTemplate = () => {
  return (
    <div style={styles.container}>
      <p style={styles.textWithMargin}>
        欢迎加入一站式悬赏任务平台 Solar
        Earn！如果您是人才，在这里您可以找到适合自己技能的赏金任务，做任务，赚赏金；如果您是项目方，在这里您可以发布赏金任务，招募华语区人才献谋划策，做出贡献。
      </p>

      <p style={styles.text}>
        关注 Solar 更多渠道，捕获最全 Solana 华语信息不迷路：
      </p>

      <p style={styles.text}>
        官网：https://www.solar.team/
        <br />
        X：https://x.com/Solana_zh
        <br />
        Telegram 社区：https://t.me/solanaZH_official
        <br />
        Telegram 技术社区：https://t.me/solanadevcamp
      </p>

      <p style={styles.salutation}>
        期待你加入 Solar 社区
        <br />
        Solar 团队
      </p>
    </div>
  );
};
