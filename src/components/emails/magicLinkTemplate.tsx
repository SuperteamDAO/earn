import React from 'react';

import { styles } from './styles';

interface TemplateProps {
  loginUrl: string;
}

export const MagicLinkTemplate = ({ loginUrl }: TemplateProps) => {
  return (
    <div style={styles.container}>
      <p style={styles.textWithMargin}>
        Welcome welcome welcome, click &mdash;{' '}
        <a href={loginUrl} style={styles.link}>
          here
        </a>{' '}
        to login
      </p>
    </div>
  );
};
