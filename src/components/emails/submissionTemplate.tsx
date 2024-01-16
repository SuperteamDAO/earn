import React from 'react';

import { styles } from './styles';

interface SubmissionProps {
  name: string;
  bountyName: string;
}

export const SubmissionTemplate = ({ name, bountyName }: SubmissionProps) => (
    <div style={styles.container}>
      <p style={styles.greetings}>Hey {name},</p>
      <p style={styles.textWithMargin}>
        Nice work! Your submission for <strong>{bountyName}</strong> has been
        received. Pour yourself a glass of something tasty &mdash; you&rsquo;ve
        earned it 🥳
      </p>
      <p style={styles.textWithMargin}>
        Once the deadline passes, you&rsquo;ll be able to see all the other
        submissions on the listing page. We&rsquo;ll then send you an email once
        the winners (hopefully including you) are announced!
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
