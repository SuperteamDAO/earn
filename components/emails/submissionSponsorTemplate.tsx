import React from 'react';

export const submissionSponsorEmailTemplate = ({
  name,
  bountyName,
}: {
  name: string;
  bountyName: string;
}) => {
  return (
    <div>
      <p>Hey there {name},</p>
      <p>Your Listing {bountyName} just received a submission!</p>
    </div>
  );
};
