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
      <p>Hey {name},</p>
      <p>
        The winners for the bounty {bountyName} have been announced! Check them
        out by clicking on the link below:&nbsp;
      </p>
      <strong>
        <a href={link}>Link</a>
      </strong>
    </div>
  );
};
