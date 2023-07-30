import React from 'react';

export const NewBountyTemplate = ({
  name,
  link,
}: {
  name: string;
  link: string;
}) => {
  return (
    <div>
      <p>Hey {name},</p>
      <p>
        Good news &mdash; a new&nbsp;listing has just arrived with your name on
        it. It&apos;s like finding a $20 bill in your pocket, but way more
        exciting! 💰
      </p>
      <p>Check out the link below to know more:&nbsp;</p>
      <p>
        <span style={{ textDecoration: 'underline', color: '#0000ff' }}>
          <a href={link}>
            <strong>Link</strong>
          </a>
        </span>
      </p>
      <p>Best,&nbsp;</p>
      <p>The Superteam Earn Crew 🦸&zwj;♀️🦸&zwj;♂️</p>
      <p>&nbsp;</p>
    </div>
  );
};
