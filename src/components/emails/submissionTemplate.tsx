import React from 'react';

import { styles } from './styles';

interface SubmissionProps {
  name: string;
  bountyName: string;
  type: 'open' | 'permissioned';
}

export const SubmissionTemplate = ({
  name,
  bountyName,
  type,
}: SubmissionProps) => {
  return (
    <div style={styles.container}>
      <p style={styles.greetings}>Hey {name},</p>
      {type === 'permissioned' ? (
        <>
          <p style={styles.textWithMargin}>
            Nice work! Your application for <strong>{bountyName}</strong> has
            been received. We are praying day in and day out that you get chosen
            for this Project listing 🫶
          </p>
          <p style={styles.textWithMargin}>
            Rest assured, we’ll email you once the winner (hopefully you) has
            been selected for the Project!
          </p>
        </>
      ) : (
        <>
          <p style={styles.textWithMargin}>
            Nice work! Your submission for <strong>{bountyName}</strong> has
            been received. Pour yourself a glass of something tasty &mdash;
            you&rsquo;ve earned it 🥳
          </p>
          <p style={styles.textWithMargin}>
            Once the deadline passes, you&rsquo;ll be able to see all the other
            submissions on the listing page. We&rsquo;ll then send you an email
            once the winners (hopefully including you) are announced!
          </p>
        </>
      )}
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
