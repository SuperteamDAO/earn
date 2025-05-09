import React from 'react';

import { CHAIN_NAME, PROJECT_NAME } from '@/constants/project';

import { styles } from '../utils/styles';

export const WelcomeTalentTemplate = () => {
  return (
    <div style={styles.container}>
      <p style={styles.textWithMargin}>
        Thanks for signing up! Welcome to {PROJECT_NAME}!
      </p>
      <p style={styles.text}>
        {PROJECT_NAME} is {CHAIN_NAME}&apos;s talent-matching platform, bringing
        ecosystem partners, organizations, and talent together to put{' '}
        {CHAIN_NAME}&apos;s projects on the map.
      </p>
      <p style={styles.text}>
        You will find some of the biggest and brightest companies,
        organizations, and sponsors across the {CHAIN_NAME} ecosystem. We are
        confident that if you are seeking opportunities, you will find them
        here!
      </p>
      <p style={styles.text}>
        You can access the listings by hitting the front page, choosing one of
        the areas at the top, and perusing the listings. When you&apos;re ready,
        submit! Don&apos;t be shy.
      </p>
      <p style={styles.salutation}>Happy hunting!</p>
    </div>
  );
};
