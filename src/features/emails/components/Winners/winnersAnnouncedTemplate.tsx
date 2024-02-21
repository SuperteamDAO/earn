import React from 'react';

import { styles } from '../../utils';

interface TemplateProps {
  name: string;
  bountyName: string;
  link: string;
}

export const WinnersAnnouncedTemplate = ({
  name,
  bountyName,
  link,
}: TemplateProps) => {
  return (
    <div style={styles.container}>
      <p style={styles.greetings}>Hey {name},</p>
      <p style={styles.textWithMargin}>
        The winners for the <strong>{bountyName}</strong> listing have been
        announced!{' '}
        <p style={styles.text}>
          <a href={link} style={styles.link}>
            Click here
          </a>{' '}
          to see who claimed the top spots.
        </p>
      </p>
      <p style={styles.text}>Best,</p>
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
