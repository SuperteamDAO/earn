import React from 'react';

import { styles } from './styles';

export const OTPTemplate = ({ code }: { code: number }) => {
  return (
    <div style={styles.container}>
      <p style={styles.greetings}>Hello,</p>
      <p style={styles.textWithMargin}>
        Your one-time password for verifying your email on Superteam Earn is{' '}
        <strong>{code}</strong>.&nbsp;
      </p>
      <p style={styles.salutation}>
        Best,
        <br />
        Superteam Earn
      </p>
    </div>
  );
};
