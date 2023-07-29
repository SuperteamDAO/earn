import React from 'react';

export const OTPTemplate = ({ code }: { code: number }) => {
  return (
    <div>
      <p>
        Your one-time password is {code}, please do not share it with anyone
      </p>
    </div>
  );
};
