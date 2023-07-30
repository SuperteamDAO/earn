import React from 'react';

export const OTPTemplate = ({ code }: { code: number }) => {
  return (
    <div>
      <p>Hello,</p>
      <p>
        Your one-time password for verifying your email on Superteam Earn is{' '}
        {code}.&nbsp;
      </p>
      <p>Best,&nbsp;</p>
      <p>The Superteam Earn Crew 🦸&zwj;♀️🦸&zwj;♂️</p>
    </div>
  );
};
