import React from 'react';

import { domPurify } from '@/lib/domPurify';

import { styles } from '../utils/styles';

interface TemplateProps {
  from: string;
  subject: string;
  description: string;
}

export const supportEmailTemplate = ({
  from,
  subject,
  description,
}: TemplateProps) => {
  return (
    <div style={styles.container}>
      <p style={styles.greetings}>New Support Request</p>
      <p style={styles.textWithMargin}>
        From: {from} <br />
        Subject: {subject} <br />
        Message:
      </p>
      <p
        dangerouslySetInnerHTML={{
          __html: domPurify(description.replace(/\n/g, '<br>')),
        }}
      ></p>
    </div>
  );
};
