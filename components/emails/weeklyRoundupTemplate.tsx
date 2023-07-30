import React from 'react';

export const WeeklyRoundupTemplate = ({
  name,
  bounties,
}: {
  name: string;
  bounties: { title: string; rewardAmount: number | null }[] | undefined;
}) => {
  return (
    <div>
      <p>Hey there, {name}!</p>
      <p>Some highlighted bounties from the week!</p>
      <ol>
        {bounties?.map((bounty, i) => (
          <li key={i}>
            {bounty.title} - Reward: ${bounty.rewardAmount ?? 'Not specified'}
          </li>
        ))}
      </ol>
      <p>Go Secure the Bag</p>
      <p>The Superteam Earn Crew 🦸‍♀️🦸‍♂️</p>
    </div>
  );
};
