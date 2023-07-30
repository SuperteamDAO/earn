import React from 'react';

export const CommentSponsorTemplate = ({
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
        The “{bountyName}” listing added by your company just received a comment
        &mdash; check it out by clicking the link below:&nbsp;
      </p>
      <strong>
        <a href={link}>Link</a>
      </strong>
    </div>
  );
};
