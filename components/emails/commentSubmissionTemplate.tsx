import React from 'react';

export const CommentSubmissionTemplate = ({
  name,
  bountyName,
  personName,
  link,
}: {
  name: string;
  bountyName: string;
  personName: string;
  link: string;
}) => {
  return (
    <div>
      <p>Hey there {name},</p>
      <p>
        {personName} left a new comment on your {bountyName}. Click on the link
        to see what they said
      </p>
      <a href={link}>Link</a>
    </div>
  );
};
