import React from 'react';

export const DeadlineEmailTemplate = ({ name }: { name: string }) => {
  return (
    <div>
      <p>Hey there {name},</p>
      <p>
        Friendly reminder that the bounty you were interested in will close in 2
        days. Go secure the bag
      </p>
      <p>The Superteam Earn Crew 🦸‍♀️🦸‍♂️</p>
    </div>
  );
};
