import React from 'react';

import { styles } from '../utils/styles';

interface TemplateProps {
  senderName: string;
  sponsorName: string;
  link: string;
}

export const InviteMemberTemplate = ({
  senderName,
  sponsorName,
  link,
}: TemplateProps) => {
  return (
    <div style={styles.container}>
      <p style={styles.greetings}>Hello,</p>
      <p style={styles.textWithMargin}>
        You have been invited by {senderName} to join{' '}
        <strong>{sponsorName}</strong> {''} on Superteam Earn!{' '}
        <a href={link} style={styles.link}>
          Click here
        </a>{' '}
        to accept the invite.
      </p>
      <p style={styles.salutation}>
        Best,
        <br />
        Superteam Earn
      </p>
    </div>
  );
};
