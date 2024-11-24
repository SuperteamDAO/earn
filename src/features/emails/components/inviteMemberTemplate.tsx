import React from 'react';

import { styles } from '../utils';

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
        您已被邀请 {senderName} 加 <strong>{sponsorName}</strong> {''} 入 Solar
        Earn!{' '}
        <a href={link} style={styles.link}>
          点击此处
        </a>{' '}
        接受邀请
      </p>
      <p style={styles.salutation}>
        祝好,
        <br />
        Solar Earn
      </p>
    </div>
  );
};
