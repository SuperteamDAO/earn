import React from 'react';

export const SubmissionTemplate = ({
  name,
  bountyName,
}: {
  name: string;
  bountyName: string;
}) => {
  return (
    <div>
      <p>Hey {name},</p>
      <p>
        Nice work! Your submission for {bountyName} has been received. Pour
        yourself a glass of something tasty &mdash; you&rsquo;ve earned it 🥳
      </p>
      <p>
        Once the deadline passes, you&rsquo;ll be able to see all the other
        submissions on the bounty page. We&rsquo;ll then send you an email once
        the winners (hopefully including you!) are announced!
      </p>
      <p>Best,&nbsp;</p>
      <p>The Superteam Earn Crew 🦸&zwj;♀️🦸&zwj;♂️</p>
    </div>
  );
};
