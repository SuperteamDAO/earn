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
      <p>Hey there {name},</p>
      <p>
        The {bountyName} listing added by your company just received a comment -
        check it out by clicking the link below.
      </p>
      <a href={link}>Link</a>
    </div>
  );
};
