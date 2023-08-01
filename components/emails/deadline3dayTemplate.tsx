import React from 'react';

import { styles } from './styles';

interface TemplateProps {
  name: string;
  bountyName: string;
  link: string;
}

export const DeadlineThreeDaysTemplate = ({
  name,
  bountyName,
  link,
}: TemplateProps) => {
  return (
    <div style={styles.container}>
      <p style={styles.text}>Hey {name},</p>
      <p style={styles.textWithMargin}>
        Friendly reminder that the bounty &quot;
        <span style={{ fontWeight: 400 }}>{bountyName}&quot;</span>you&nbsp;had
        indicated&nbsp;interest in will close in 3 days!{' '}
        <a href={link} style={styles.link}>
          Click here
        </a>
        to take another look.
      </p>
      <p style={styles.textWithMargin}>Best,&nbsp;</p>
      <p style={styles.text}>The Superteam Earn Crew 🦸&zwj;♀️🦸&zwj;♂️</p>
    </div>
  );
};
