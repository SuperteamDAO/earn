import React from 'react';

import { PROJECT_NAME } from '@/constants/project';

import { styles } from '../utils/styles';

interface TemplateProps {
  token: string;
}

export const OTPTemplate = ({ token }: TemplateProps) => {
  return (
    <div style={styles.container}>
      <p style={styles.greetings}>Hello,</p>
      <p style={styles.textWithMargin}>
        Your OTP for logging into {PROJECT_NAME} is <b>{token}</b>. This OTP is
        valid for 30 minutes.
      </p>
      <p style={styles.salutation}>
        Best,
        <br />
        {PROJECT_NAME}
      </p>
    </div>
  );
};
