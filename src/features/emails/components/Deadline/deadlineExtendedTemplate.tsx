import React from 'react';

import { styles } from '../../utils/styles';

interface TemplateProps {
  listingName: string;
  link: string;
}

export const DeadlineExtendedTemplate = ({
  listingName,
  link,
}: TemplateProps) => {
  return (
    <div style={styles.container}>
      <p style={styles.greetings}>Hello,</p>
      <p style={styles.textWithMargin}>
        Quick heads up – the deadline for the{' '}
        <a href={link} style={styles.link}>
          {listingName}
        </a>{' '}
        listing has been updated. Check it out and adjust your plans
        accordingly!
      </p>
      <p style={styles.salutation}>
        Best,
        <br />
        Superteam Earn
      </p>
    </div>
  );
};
