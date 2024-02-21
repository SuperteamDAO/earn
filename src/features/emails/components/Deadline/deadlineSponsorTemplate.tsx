import React from 'react';

import { styles } from '../../utils/styles';

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
        The deadline for your listing <strong>{bountyName}</strong>
        &nbsp; has expired. Please review the submissions and announce the
        winners on Superteam Earn&nbsp;within 5 to 7 days.
      </p>
      <p style={styles.textWithMargin}>
        <a href={link} style={styles.link}>
          Click here
        </a>{' '}
        to review&nbsp;the submissions. &nbsp;
      </p>
      <p style={styles.salutation}>
        Best,
        <br />
        Superteam Earn
      </p>
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
