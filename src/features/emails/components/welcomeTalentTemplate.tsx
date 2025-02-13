import React from 'react';

import { CEO_NAME, PROJECT_NAME } from '@/constants/project';

import { styles } from '../utils/styles';

export const WelcomeTalentTemplate = () => {
  return (
    <div style={styles.container}>
      <p style={styles.textWithMargin}>
        OK let&apos;s get this out of the way.
      </p>
      <p style={styles.text}>Even though this is an automated email...</p>
      <p style={styles.text}>
        I just wanted to say hey and let you know that I&apos;m a real person.
      </p>
      <p style={styles.text}>
        I&apos;m {CEO_NAME}, the CEO of {PROJECT_NAME}. I might not know you
        personally yet, but I&apos;m pumped that you&apos;re here.
      </p>
      <p style={styles.text}>
        You have my word that we&apos;ll be respectful of your inbox and only
        email you when we have some fresh new opportunities or a big
        announcement that we want to tell you about.
      </p>
      <p style={styles.text}>
        <strong>One favor before I go: </strong> reply to this email and let me
        know why you joined {PROJECT_NAME}!
      </p>
      <p style={styles.text}>Would love to learn more about you.</p>

      <p style={styles.salutation}>
        Talk soon, <br />
        {CEO_NAME}
      </p>
    </div>
  );
};
