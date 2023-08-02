import React from 'react';

import { styles } from './styles';

interface Bounty {
  title: string;
  sponsor: string;
  slug: string;
  rewardAmount: number | null;
}

interface TemplateProps {
  name: string;
  bounties: Bounty[] | undefined;
}

export const WeeklyRoundupTemplate = ({ name, bounties }: TemplateProps) => {
  return (
    <div style={styles.container}>
      <p style={styles.text}>Hey there, {name}!</p>
      <p style={styles.textWithMargin}>
        Here&apos;s a curated round-up of all live bounties, made just for you!
      </p>
      <ol style={styles.list}>
        {bounties?.map((bounty, i) => (
          <li key={i} style={styles.text}>
            <a
              href={`https://earn.superteam.fun/listings/bounties/${
                bounty?.slug || ''
              }/?utm_source=superteamearn&utm_medium=email&utm_campaign=notifications`}
              style={styles.link}
            >
              {bounty.title} by {bounty.sponsor} ($
              {bounty.rewardAmount ?? 'Not specified'})
            </a>
          </li>
        ))}
      </ol>
      <p style={styles.textWithMargin}>Go Secure the Bag,</p>
      <p style={styles.text}>The Superteam Earn Crew 🦸‍♀️🦸‍♂️</p>
    </div>
  );
};
