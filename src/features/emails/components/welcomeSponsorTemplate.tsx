import React from 'react';

import { PROJECT_NAME } from '@/constants/project';
import { PDTG } from '@/constants/Telegram';

import { styles } from '../utils/styles';

export const WelcomeSponsorTemplate = () => {
  return (
    <div style={styles.container}>
      <p style={styles.text}>Welcome to {PROJECT_NAME}!</p>
      <p style={styles.textWithMargin}>
        Thank you for signing up. {PROJECT_NAME} is the premier talent-matching
        platform in crypto, favoured by hundreds of leading companies and
        thousands of verified crypto-focused talent.
      </p>
      <p style={styles.textWithMargin}>
        If you need any help related to setting up your listing on{' '}
        {PROJECT_NAME}, don&apos;t hesitate to contact me on&nbsp;
        <a href={PDTG} style={styles.link}>
          Telegram
        </a>
        .
      </p>
      <p style={styles.salutation}>
        Best,
        <br />
        {PROJECT_NAME}
      </p>
    </div>
  );
};
