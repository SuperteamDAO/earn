import React from 'react';

import { styles } from '../../utils';

interface TemplateProps {
  name: string | null;
  listingName: string;
}

export const SuperteamWinnersTemplate = ({
  name,
  listingName,
}: TemplateProps) => {
  return (
    <div style={styles.container}>
      <p style={styles.greetings}>Hey {name},</p>
      <p style={styles.textWithMargin}>
        Congrats on winning the <strong>{listingName}</strong> listing! Please
        fill out{' '}
        <a
          href={'https://airtable.com/appPZ5nE1OqZiBKx7/shr3g5kAGqvResVCx'}
          style={styles.link}
        >
          this form
        </a>{' '}
        to receive your bounty reward. Please select &quot;Pratik Dholani&quot;
        as the Project Lead.
      </p>
      <p style={styles.textWithMargin}>
        We follow a weekly payout system. Therefore, your bounty reward might
        take up to a week to show up in your wallet. If you would like to track
        the status of your payment, you can do so{' '}
        <a
          href={'https://in.superteam.fun/payment-pipeline'}
          style={styles.link}
        >
          here
        </a>{' '}
        (your entry will show up once your payout request is verified).
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
