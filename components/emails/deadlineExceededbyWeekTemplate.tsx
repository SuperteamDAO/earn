import React from 'react';

export const DeadlineExceededbyWeekTemplate = ({
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
        The deadline for the &quot;{bountyName}&quot; bounty expired a week
        ago.&nbsp;The participants of the bounty would be expecting the
        results&nbsp;to be out&nbsp;soon&nbsp;&mdash; request you to publish the
        winners on Earn&nbsp;shortly!&nbsp;&nbsp;
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
