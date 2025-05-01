import React from 'react';

import { HELP_URL, PROJECT_NAME } from '@/constants/project';

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
        {PROJECT_NAME}, don&apos;t hesitate to
        <a href={HELP_URL} style={styles.link}>
          contact us
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
