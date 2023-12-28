import React from 'react';

import { styles } from './styles';

interface TemplateProps {
  name: string;
  bountyName: string;
  link: string;
}

export const DeadlineExceededbyWeekTemplate = ({
  name,
  bountyName,
  link,
}: TemplateProps) => {
  return (
    <div style={styles.container}>
      <p style={styles.greetings}>Hey {name},</p>
      <p style={styles.textWithMargin}>
        It has been a week since the <strong>{bountyName}</strong> listing
        expired. The participants would be expecting the results to be out soon
        — request you to publish the winners on Earn shortly!
      </p>
      <p style={styles.textWithMargin}>
        <a href={link} style={styles.link}>
          Click here
        </a>{' '}
        to review the submissions.
      </p>
      <p style={styles.salutation}>Best,</p>
      <p style={styles.text}>Superteam Earn</p>
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
