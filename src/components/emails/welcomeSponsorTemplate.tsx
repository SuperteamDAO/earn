import React from 'react';

import { styles } from './styles';

export const WelcomeSponsorTemplate = () => {
  return (
    <div style={styles.container}>
      <p style={styles.text}>Welcome to Superteam Earn!</p>
      <p style={styles.textWithMargin}>
        Thank you for signing up. Earn is the premier talent-matching platform,
        favored by over 100 leading Solana projects &mdash; we are excited to
        have you as one of them!
      </p>
      <p style={styles.textWithMargin}>
        If you need any help related to setting up your listing on Earn,
        don&apos;t hesitate to get in touch with&nbsp;
        <a href="https://t.me/pratikdholani" style={styles.link}>
          Pratik
        </a>{' '}
        on Telegram.&nbsp;
      </p>
      <p style={styles.text}>&nbsp;</p>
    </div>
  );
};
