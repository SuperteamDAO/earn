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
      <p>Hey there {name},</p>
      <p>
        Woah! People are really digging your work on the {bountyName} bounty.
        Keep it up!
      </p>
      <p>
        Check out the other submissions here and spread some love to the other
        participants!
      </p>
      <a href={link}>Link</a>
    </div>
  );
};
