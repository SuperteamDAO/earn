import * as Sentry from '@sentry/nextjs';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

export default function Custom404() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      Sentry.captureMessage(`Page Not Found: ${router.asPath}`, {
        level: 'error',
        extra: {
          route: router.asPath,
        },
      });
    }
  }, [router.asPath]);

  return (
    <>
      <Default
        meta={
          <Meta
            title="Not Found | Superteam Earn"
            description="404 - Page Not Found"
          />
        }
      >
        <div className="flex flex-col items-center justify-center gap-4">
          <img alt="404 page" src="/assets/bg/404.svg" />
          <p className="text-xl font-medium text-black">Nothing Found</p>
          <p className="max-w-2xl text-center text-base text-gray-500 lg:text-lg">
            Sorry, we couldn&apos;t find what you were looking for. It’s
            probably your own fault, please check your spelling or meanwhile
            have a look at this cat
          </p>
          <img
            className="mb-72 w-[20rem] lg:w-[30rem]"
            alt="cat image"
            src="/assets/bg/cat.png"
          />
        </div>
      </Default>
    </>
  );
}
