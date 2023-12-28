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
      <p style={styles.greetings}>Hey there, {name}!</p>
      <p style={styles.textWithMargin}>
        Here&apos;s a weekly round-up of all live listings, curated just for
        you:
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
      <p style={styles.salutation}>Best,</p>
      <p style={styles.text}>Superteam Earn</p>
      <p style={styles.unsubscribe}>
        Click{' '}
        <a
          href="https://airtable.com/appqA0tn8zKv3WJg9/shrsil6vncuj35nHn"
          style={styles.unsubscribeLink}
        >
          here
        </a>{' '}
        to unsubscribe from all emails from Superteam Earn.
      </p>
    </div>
  );
};
