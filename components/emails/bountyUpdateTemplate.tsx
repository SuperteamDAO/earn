import React from 'react';

export const BountyUpdateTemplate = ({
  bountyName,
}: {
  bountyName: string;
}) => {
  return (
    <div>
      <p>Hey there,</p>
      <p>
        The bounty {bountyName} has been edited. Click below to go to the
        updated bounty!
      </p>
    </div>
  );
};
