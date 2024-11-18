import NextLink from 'next/link';
import React from 'react';

export const AnnouncementBar = () => {
  const href = '/hackathon/radar';

  return (
    <NextLink
      href={href}
      className="block w-full bg-brand-purple text-white md:hidden"
    >
      <p className="p-3 text-center text-[11px] font-medium md:text-sm">
        <NextLink href={href} className="underline">
          Click here
        </NextLink>{' '}
        to unlock $250k+ in prizes at Solana&apos;s global hackathon,
        exclusively on Earn
      </p>
    </NextLink>
  );
};
