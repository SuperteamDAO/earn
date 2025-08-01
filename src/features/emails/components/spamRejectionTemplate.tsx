import React from 'react';

import { styles } from '../utils/styles';

interface SpamRejectionTemplateProps {
  firstName: string;
  listingName: string;
  listingUrl: string;
  spamDisputeUrl: string;
}

export const SpamRejectionTemplate = ({
  firstName,
  listingName,
  listingUrl,
  spamDisputeUrl,
}: SpamRejectionTemplateProps) => {
  return (
    <div style={styles.container}>
      <p style={styles.textWithMargin}>Hey {firstName},</p>
      <p style={styles.textWithMargin}>
        Your application for{' '}
        <a href={listingUrl} style={styles.link}>
          {listingName}
        </a>{' '}
        was reported as spam and hence rejected by the sponsor/reviewer. Since
        it was marked as spam, 1 submission credit will be deducted from your
        credit balance next month.
      </p>
      <p style={styles.textWithMargin}>
        We hope you can take this feedback constructively and submit some
        winning applications soon. If you strongly believe that this application
        has been marked as spam unreasonably or there has been a mistake, please{' '}
        <a href={spamDisputeUrl} style={styles.link}>
          click here
        </a>{' '}
        to dispute it, and our team will have a look at your concern.
      </p>
      <p style={styles.salutation}>
        Best,
        <br />
        Superteam Earn
      </p>
      <p style={styles.unsubscribe}>
        <a href="%unsubscribe_url%" style={styles.unsubscribeLink}>
          Unsubscribe
        </a>{' '}
        |{' '}
        <a href="%web_version%" style={styles.unsubscribeLink}>
          View in browser
        </a>
      </p>
    </div>
  );
};
