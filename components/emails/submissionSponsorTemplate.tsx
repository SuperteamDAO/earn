import React from 'react';

export const SubmissionSponsorTemplate = ({
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
        Your listing &quot;{bountyName}&quot; just received a submission on
        Superteam Earn! Check out the submissions by clicking&nbsp;the link
        below:&nbsp;&nbsp;
      </p>
      <p>
        <strong>
          <a href={link}>Link</a>
        </strong>
      </p>
    </div>
  );
};
