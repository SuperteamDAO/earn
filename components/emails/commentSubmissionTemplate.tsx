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
      <p>Hey&nbsp;{name},</p>
      <p>
        {personName} left a new comment on your submission to the ”{bountyName}”
        listing. Click on the link below to see what they said:&nbsp;
      </p>
      <strong>
        <a href={link}>Link</a>
      </strong>
    </div>
  );
};
