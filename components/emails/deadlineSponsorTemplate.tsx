import React from 'react';

export const DeadlineSponsorTemplate = ({
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
        The deadline for the &quot;{bountyName}&quot;&nbsp;bounty&nbsp;you had
        listed has expired. Please review the submissions and announce the
        winners on Superteam Earn&nbsp;soon!
      </p>
      <p>Click the link below to review&nbsp;the submissions:&nbsp;</p>
      <p>
        <span style={{ textDecoration: 'underline', color: '#0000ff' }}>
          <a href={link}>
            <strong>Link</strong>
          </a>
        </span>
        &nbsp;
      </p>
      <p>Best,</p>
      <p>The Superteam Earn Crew 🦸&zwj;♀️🦸&zwj;♂️</p>
    </div>
  );
};
