import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

import { HELP_URL, PROJECT_NAME } from '@/constants/project';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useUser } from '@/store/user';
import { getURL } from '@/utils/validUrl';

export default function Blocked() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user && !user?.isBlocked) {
      router.push('/');
    }
  }, [user]);

  return (
    <Default
      meta={
        <Meta
          title={`${PROJECT_NAME} | Access Restricted`}
          description={`Explore the latest opportunities on ${PROJECT_NAME}, featuring professional projects in Design, Development, and Content Creation.`}
          canonical={getURL()}
        />
      }
    >
      <div className="mx-auto mt-10 max-w-[800px] px-4">
        <p className="text-center text-3xl font-medium text-slate-600">
          Your access to {PROJECT_NAME} has been restricted. Please get in touch
          with{' '}
          <Link className="text-brand-green" href={HELP_URL}>
            us
          </Link>{' '}
          if you have any questions for more information.
        </p>
      </div>
    </Default>
  );
}
