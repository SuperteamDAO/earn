import React from 'react';

export const SubmissionLikeTemplate = ({
  name,
  bountyName,
  link,
}: {
  name: string;
  bountyName: string;
  link: string;
}) => {
  return (
    <div>
      <p>Hey {name},</p>
      <p>
        People are really digging your work on the {bountyName} bounty. Keep it
        up!
      </p>
      <p>
        Check out the other submissions here and spread some love to the other
        participants!
      </p>
      <strong>
        <a href={link}>Link</a>
      </strong>
    </div>
  );
};
