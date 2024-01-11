import React from 'react';

import { styles } from './styles';

interface TemplateProps {
  loginUrl: string;
}

export const MagicLinkTemplate = ({ loginUrl }: TemplateProps) => {
  return (
    <div style={styles.container}>
      <p style={styles.greetings}>Hello,</p>
      <p style={styles.textWithMargin}>
        Please click{' '}
        <a href={loginUrl} style={styles.link}>
          here
        </a>{' '}
        to verify your email and log into Superteam Earn.
      </p>
      <p style={styles.salutation}>
        Best,
        <br />
        Superteam Earn
      </p>
    </div>
  );
};
