import React from 'react';

export const submissionEmailTemplate = ({
  name,
  bountyName,
}: {
  name: string;
  bountyName: string;
}) => {
  return (
    <div>
      <p>Hey there {name},</p>
      <p>
        Nice work! Your submission for {bountyName} has been received. Pour
        yourself a glass of something tasty - you’ve earned it 🥳
      </p>
      <p>
        Once the deadline passes, you’ll be able to see all the other
        submissions on the bounty page. We’ll then send you an email once the
        winners (hopefully including you!) are announced.
      </p>
    </div>
  );
};
