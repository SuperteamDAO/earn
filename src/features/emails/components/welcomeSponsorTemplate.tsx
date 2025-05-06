import React from 'react';

import { CHAIN_NAME, HELP_URL, PROJECT_NAME } from '@/constants/project';

import { styles } from '../utils/styles';

export const WelcomeSponsorTemplate = () => {
  return (
    <div style={styles.container}>
      <p style={styles.text}>Welcome to {PROJECT_NAME}!</p>
      <p style={styles.textWithMargin}>
        Thanks for signing up! Welcome to {PROJECT_NAME}!
      </p>
      <p style={styles.textWithMargin}>
        {PROJECT_NAME} is {CHAIN_NAME}&apos;s talent-matching platform, bringing
        ecosystem partners, organizations, and talent together to put{' '}
        {CHAIN_NAME}&apos;s projects on the map.
        <br />
        We are confident you will find many talented people to recruit for your
        projects, bounties, and freelance opportunities. Jump right in and get
        your first listing started! Soon, you will have plenty of submissions to
        review.
      </p>
      <p style={styles.textWithMargin}>
        If you need any help related to setting up your listing on{' '}
        {PROJECT_NAME}, don&apos;t hesitate to
        <a href={HELP_URL} style={styles.link}>
          contact us
        </a>
        .
      </p>
      <p style={styles.salutation}>Happy building!</p>
    </div>
  );
};
