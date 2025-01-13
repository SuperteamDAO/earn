import React from 'react';

import { PDTG } from '@/constants/Telegram';

import { styles } from '../utils/styles';

export const WelcomeSponsorTemplate = () => {
  return (
    <div style={styles.container}>
      <p style={styles.text}>Welcome to Superteam Earn!</p>
      <p style={styles.textWithMargin}>
        Thank you for signing up. Earn is the premier talent-matching platform
        in crypto, favoured by hundreds of leading companies and thousands of
        verified crypto-focused talent.
      </p>
      <p style={styles.textWithMargin}>
        If you need any help related to setting up your listing on Earn,
        don&apos;t hesitate to contact me on&nbsp;
        <a href={PDTG} style={styles.link}>
          Telegram
        </a>
        .
      </p>
      <p style={styles.salutation}>
        Best,
        <br />
        Superteam Earn
      </p>
    </div>
  );
};
