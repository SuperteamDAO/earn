import React from 'react';

import { styles } from '../utils';

export const WelcomeTalentTemplate = () => {
  return (
    <div style={styles.container}>
      <p style={styles.textWithMargin}>
        OK let&apos;s get this out of the way.
      </p>
      <p style={styles.text}>这是一封自动发送的邮件...</p>
      <p style={styles.text}>
        我只是想打个招呼并让你知道我&apos;是一个真实的人
      </p>
      <p style={styles.text}>
        我&apos;是Vesper, 我&apos;是Solar社区成员，一直贡献{' '}
        <a href={process?.env?.NEXT_PUBLIC_SITE_URL} style={styles.link}>
          Solar
        </a>
        . 我可能还不认识你个人，但我&apos;很开心&apos;你的加入。
      </p>
      <p style={styles.text}>
        我向你保证，我很开心&apos;收到你的邮件，只有在有新的机会或重大公告我都会给你发邮件
      </p>
      <p style={styles.text}>
        <strong>结束对话之前 </strong>{' '}
        有一个请求：请回复邮件，告诉我你为什么加入 Solar Earn？
      </p>
      <p style={styles.text}>很高兴能更多地了解你</p>

      <p style={styles.salutation}>
        保持联系, <br />
        Vesper
      </p>
    </div>
  );
};
