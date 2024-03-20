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
        Your OTP for logging into Superteam Earn is <b>{token}</b>. This OTP is
        valid for 30 minutes.
      </p>
      <p style={styles.salutation}>
        Best,
        <br />
        Superteam Earn
      </p>
    </div>
  );
};
