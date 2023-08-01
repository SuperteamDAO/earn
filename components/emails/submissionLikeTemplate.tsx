import React from 'react';

import { styles } from './styles';

interface TemplateProps {
  name: string;
  bountyName: string;
  link: string;
}

export const SubmissionLikeTemplate = ({
  name,
  bountyName,
  link,
}: TemplateProps) => {
  return (
    <div style={styles.container}>
      <p style={styles.text}>Hey {name},</p>
      <p style={styles.textWithMargin}>
        People are really digging your work on the <strong>{bountyName}</strong>{' '}
        bounty. Keep it up!
      </p>
      <p style={styles.textWithMargin}>
        Check out the other submissions here and spread some love to the other
        participants!
      </p>
      <a href={link} style={styles.link}>
        View Submissions
      </a>
    </div>
  );
};
