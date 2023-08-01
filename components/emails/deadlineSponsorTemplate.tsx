import React from 'react';

import { styles } from './styles';

interface TemplateProps {
  name: string;
  bountyName: string;
  link: string;
}

export const DeadlineSponsorTemplate = ({
  name,
  bountyName,
  link,
}: TemplateProps) => {
  return (
    <div style={styles.container}>
      <p style={styles.text}>Hey {name},</p>
      <p style={styles.textWithMargin}>
        The deadline for the <strong>{bountyName}</strong>&nbsp;bounty&nbsp;you
        had listed has expired. Please review the submissions and announce the
        winners on Superteam Earn&nbsp;soon!
      </p>
      <p style={styles.textWithMargin}>
        <a href={link} style={styles.link}>
          Click here
        </a>
        to review&nbsp;the submissions:&nbsp;
      </p>
      <p style={styles.textWithMargin}>
        <a href={link} style={styles.link}>
          Link
        </a>
        &nbsp;
      </p>
      <p style={styles.textWithMargin}>Best,</p>
      <p style={styles.text}>The Superteam Earn Crew 🦸&zwj;♀️🦸&zwj;♂️</p>
    </div>
  );
};
