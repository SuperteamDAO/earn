import React from 'react';

interface TemplateProps {
  name: string;
  bountyName: string;
  link: string;
}

export const CommentSponsorTemplate = ({
  name,
  bountyName,
  link,
}: TemplateProps) => {
  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        color: '#333',
        margin: '0 auto',
        padding: '20px',
      }}
    >
      <p style={{ fontSize: '14px', lineHeight: '20px' }}>Hey {name},</p>
      <p style={{ fontSize: '14px', lineHeight: '20px', margin: '10px 0' }}>
        The <strong>{bountyName}</strong> listing added by your company just
        received a comment &mdash;{' '}
        <a href={link} style={{ color: '#007BFF', textDecoration: 'none' }}>
          check it out
        </a>
      </p>
      <p style={{ fontSize: '14px', marginBottom: '10px', lineHeight: '20px' }}>
        Best,&nbsp;
      </p>
      <p style={{ fontSize: '14px', lineHeight: '20px' }}>
        The Superteam Earn Crew 🦸&zwj;♀️🦸&zwj;♂️
      </p>
    </div>
  );
};
