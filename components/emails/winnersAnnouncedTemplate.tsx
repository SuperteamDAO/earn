import React from 'react';

import { styles } from './styles';

interface TemplateProps {
  name: string;
  bountyName: string;
  link: string;
}

export const WinnersAnnouncedTemplate = ({
  name,
  bountyName,
  link,
}: TemplateProps) => {
  return (
    <div style={styles.container}>
      <p style={styles.text}>Hey {name},</p>
      <p style={styles.textWithMargin}>
        The winners for the bounty <strong>{bountyName}</strong> have been
        announced!{' '}
        <p style={styles.text}>
          <a href={link} style={styles.link}>
            Click here
          </a>
          to see who claimed the top spots.
        </p>
      </p>
      <p style={styles.text}>Best,&nbsp;</p>
      <p style={styles.text}>The Superteam Earn Crew 🦸&zwj;♀️🦸&zwj;♂️</p>
    </div>
  );
};
