import React from 'react';

import { styles } from './styles';

interface TemplateProps {
  name: string;
  bountyName: string;
  link: string;
}

export const SubmissionSponsorTemplate = ({
  name,
  bountyName,
  link,
}: TemplateProps) => {
  return (
    <div style={styles.container}>
      <p style={styles.text}>Hey {name},</p>
      <p style={styles.textWithMargin}>
        Your listing <strong>{bountyName}</strong> just received a submission on
        Superteam Earn! &mdash;{' '}
        <a href={link} style={styles.link}>
          check it out.
        </a>
      </p>
      <p style={styles.textWithMargin}>Best,&nbsp;</p>
      <p style={styles.text}>The Superteam Earn Crew 🦸&zwj;♀️🦸&zwj;♂️</p>
    </div>
  );
};
