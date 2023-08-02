import React from 'react';

import { styles } from './styles';

export const OTPTemplate = ({ code }: { code: number }) => {
  return (
    <div style={styles.container}>
      <p style={styles.text}>Hello,</p>
      <p style={styles.textWithMargin}>
        Your one-time password for verifying your email on Superteam Earn is{' '}
        <strong>{code}</strong>.&nbsp;
      </p>
      <p style={styles.textWithMargin}>Best,&nbsp;</p>
      <p style={styles.text}>The Superteam Earn Crew 🦸&zwj;♀️🦸&zwj;♂️</p>
    </div>
  );
};
