import React from 'react';

import { styles } from './styles';

interface TemplateProps {
  name: string;
  bountyName: string;
  link: string;
}

export const CommentSponsorTemplate = ({
  name,
  bountyName,
  link,
}: TemplateProps) => (
    <div style={styles.container}>
      <p style={styles.greetings}>Hello {name},</p>
      <p style={styles.textWithMargin}>
        Your listing <strong>{bountyName}</strong> just received a comment
        &mdash;{' '}
        <a href={link} style={styles.link}>
          check it out!
        </a>
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
