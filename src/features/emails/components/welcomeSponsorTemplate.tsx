import React from 'react';

import { styles } from '../utils';

export const WelcomeSponsorTemplate = () => {
  return (
    <div style={styles.container}>
      <p style={styles.text}>Welcome to Superteam Earn!</p>
      <p style={styles.textWithMargin}>
        Thank you for signing up. Earn is the premier talent-matching platform
        in crypto, favored by hundreds of leading companies and thousands of
        verified crypto-focused talent.
      </p>
      <p style={styles.textWithMargin}>
        If you need any help related to setting up your listing on Earn,
        don&apos;t hesitate to get in touch with&nbsp;
        <a href="https://t.me/pratikdholani" style={styles.link}>
          Pratik
        </a>{' '}
        on Telegram.&nbsp;
      </p>
      <p style={styles.salutation}>
        Best,
        <br />
        Superteam Earn
      </p>
    </div>
  );
};
