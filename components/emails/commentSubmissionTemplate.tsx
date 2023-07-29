import React from 'react';

export const CommentSubmissionEmailTemplate = ({
  name,
  bountyName,
  personName,
}: {
  name: string;
  bountyName: string;
  personName: string;
}) => {
  return (
    <div>
      <p>Hey there {name},</p>
      <p>
        {personName} left a new comment on your {bountyName}. Click on the link
        to see what they said
      </p>
    </div>
  );
};
