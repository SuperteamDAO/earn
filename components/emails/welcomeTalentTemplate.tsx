import React from 'react';

import { styles } from './styles';

export const WelcomeTalentTemplate = ({ name }: { name: string }) => {
  return (
    <div style={styles.container}>
      <p style={styles.greetings}>Hey there {name},</p>
      <p style={styles.textWithMargin}>
        Congrats on joining the Talent Network on Superteam Earn &mdash;
        we&apos;re hyped to have you on board! 🎉&nbsp;
      </p>
      <p style={styles.text}>
        We hope Earn can help you grow your wallet balance and expand your proof
        of work.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      </p>
      <p style={styles.textWithMargin}>Wish you all the best!</p>
      <p style={styles.salutation}>Best,</p>
      <p style={styles.text}>The&nbsp;Superteam Earn Crew 🦸&zwj;♀️🦸&zwj;♂️</p>
    </div>
  );
};
