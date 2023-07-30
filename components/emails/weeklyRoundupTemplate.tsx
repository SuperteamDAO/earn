import React from 'react';

import { getURL } from '@/utils/validUrl';

export const WeeklyRoundupTemplate = ({
  name,
  bounties,
}: {
  name: string;
  bounties:
    | {
        title: string;
        sponsor: string;
        slug: string;
        rewardAmount: number | null;
      }[]
    | undefined;
}) => {
  return (
    <div>
      <p>Hey there, {name}!</p>
      <p>
        Here&apos;s a curated round-up of all live bounties, made just for you!
      </p>
      <ol>
        {bounties?.map((bounty, i) => (
          <li key={i}>
            <a
              href={`${getURL()}listings/bounties/${
                bounty?.slug || ''
              }/?utm_source=superteamearn&utm_medium=email&utm_campaign=notifications`}
            >
              {bounty.title} by - {bounty.sponsor} ($
              {bounty.rewardAmount ?? 'Not specified'})
            </a>
          </li>
        ))}
      </ol>
      <p>Go Secure the Bag,</p>
      <p>The Superteam Earn Crew 🦸‍♀️🦸‍♂️</p>
    </div>
  );
};
