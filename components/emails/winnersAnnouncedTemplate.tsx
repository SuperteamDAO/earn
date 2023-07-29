import React from 'react';

export const WinnersAnnouncedTemplate = ({
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
      <p>The winners for the bounty {bountyName} have been announced!</p>
      <a href={link}>Link</a>
    </div>
  );
};
