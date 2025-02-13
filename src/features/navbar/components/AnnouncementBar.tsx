import Link from 'next/link';
import React from 'react';

import { CHAIN_NAME } from '@/constants/project';

export const AnnouncementBar = () => {
  const href = '/hackathon/radar';

  return (
    <Link
      href={href}
      className="block w-full bg-brand-purple text-white md:hidden"
    >
      <p className="p-3 text-center text-[11px] font-medium md:text-sm">
        <Link href={href} className="underline">
          Click here
        </Link>{' '}
        to unlock $250k+ in prizes at {CHAIN_NAME}&apos;s global hackathon,
        exclusively on Earn
      </p>
    </Link>
  );
};
