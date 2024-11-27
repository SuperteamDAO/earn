import React from 'react';

import { styles } from '../utils';

interface TemplateProps {
  token: string;
}

export const OTPTemplate = ({ token }: TemplateProps) => {
  return (
    <div style={styles.container}>
      <p style={styles.greetings}>Hello,</p>
      <p style={styles.textWithMargin}>
        您登录 Solar Earn 的验证码是 <b>{token}</b> 此验证码有效期为 30 分钟。
      </p>
      <p style={styles.salutation}>
        祝好，
        <br />
        Solar 团队
      </p>
    </div>
  );
};
