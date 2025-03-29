import Link from 'next/link';
import React from 'react';

export const AnnouncementBar = () => {
  const href = '/hackathon/radar';

  return (
    <Link
      href={href}
      className="bg-brand-purple block w-full text-white md:hidden"
    >
      <p className="p-3 text-center text-[11px] font-medium md:text-sm">
        <Link href={href} className="underline">
          Click here
        </Link>{' '}
        to unlock $250k+ in prizes at Solana&apos;s global hackathon,
        exclusively on Earn
      </p>
    </Link>
  );
};
