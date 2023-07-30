import React from 'react';

export const DeadlineThreeDaysTemplate = ({
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
        Friendly reminder that the bounty &quot;
        <span style={{ fontWeight: 400 }}>{bountyName}&quot;</span>you&nbsp;had
        indicated&nbsp;interest in will close in 3 days! Click the link below to
        check it out:&nbsp;
      </p>
      <strong>
        <a href={link}>Link</a>
      </strong>
      <p>Best,&nbsp;</p>
      <p>The Superteam Earn Crew 🦸&zwj;♀️🦸&zwj;♂️</p>
    </div>
  );
};
