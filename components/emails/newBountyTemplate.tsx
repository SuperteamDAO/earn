import React from 'react';

import { styles } from './styles';

interface NewBountyProps {
  name: string;
  link: string;
}

export const NewBountyTemplate = ({ name, link }: NewBountyProps) => {
  return (
    <div style={styles.container}>
      <p style={styles.greetings}>Hey {name},</p>
      <p style={styles.textWithMargin}>
        Good news &mdash; a new&nbsp;listing has just arrived with your name on
        it. It&apos;s like finding a $20 bill in your pocket, but way more
        exciting! 💰
      </p>
      <p style={styles.textWithMargin}>
        <a href={link} style={styles.link}>
          Click here
        </a>{' '}
        to learn more about the bounty.
      </p>
      <p style={styles.salutation}>Best,&nbsp;</p>
      <p style={styles.text}>The Superteam Earn Crew 🦸&zwj;♀️🦸&zwj;♂️</p>
      <p style={styles.text}>&nbsp;</p>
    </div>
  );
};
