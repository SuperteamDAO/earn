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
      <p style={styles.greetings}>Hey {name},</p>
      <p style={styles.textWithMargin}>
        The deadline for the <strong>{bountyName}</strong>&nbsp;bounty&nbsp;you
        had listed has expired. Please review the submissions and announce the
        winners on Superteam Earn&nbsp;soon!
      </p>
      <p style={styles.textWithMargin}>
        <a href={link} style={styles.link}>
          Click here
        </a>{' '}
        to review&nbsp;the submissions. &nbsp;
      </p>
      <p style={styles.salutation}>Best,</p>
      <p style={styles.text}>The Superteam Earn Crew 🦸&zwj;♀️🦸&zwj;♂️</p>
      <p style={styles.unsubscribe}>
        Click{' '}
        <a
          href="https://airtable.com/appqA0tn8zKv3WJg9/shrsil6vncuj35nHn"
          style={styles.unsubscribeLink}
        >
          here
        </a>{' '}
        to unsubscribe from all emails from Superteam Earn.
      </p>
    </div>
  );
};
