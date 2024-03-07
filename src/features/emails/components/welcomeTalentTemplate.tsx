import React from 'react';

import { styles } from '../utils';

export const WelcomeTalentTemplate = () => {
  return (
    <div style={styles.container}>
      <p style={styles.textWithMargin}>
        OK let&apos;s get this out of the way.
      </p>
      <p style={styles.text}>Even though this is an automated email...</p>
      <p style={styles.text}>
        I just wanted to say hey and let you know that I&apos;m a real person
      </p>
      <p style={styles.text}>
        I&apos;m Kash, and I&apos;m a Core Contributor over at{' '}
        <a href="https://superteam.fun" style={styles.link}>
          Superteam
        </a>
        . I might not know you personally yet, but I&apos;m pumped that
        you&apos;re here.
      </p>
      <p style={styles.text}>
        You have my word that we&apos;ll be respectful of your inbox and only
        email you when we have some fresh new opportunities or a big
        announcement that we want to tell you about.
      </p>
      <p style={styles.text}>
        <strong>One favor before I go: </strong> reply to this email and let me
        know why you joined Superteam Earn?
      </p>
      <p style={styles.text}>Would love to learn more about you.</p>

      <p style={styles.salutation}>
        Talk soon, <br />
        Kash
      </p>
    </div>
  );
};
