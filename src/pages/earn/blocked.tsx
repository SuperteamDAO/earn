import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useUser } from '@/store/user';

export default function Blocked() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user && !user?.isBlocked) {
      // react-doctor-disable-next-line react-doctor/nextjs-no-client-side-redirect -- the blocked flag comes from the client-side user store; this page has no server data fetching that could read the session
      router.push('/earn');
    }
  }, [user, router]);

  return (
    <Default
      meta={
        <>
          <Meta
            title="Blocked | Superteam Earn"
            description="Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content."
          />
          <Head>
            <meta name="robots" content="noindex, nofollow" />
          </Head>
        </>
      }
    >
      <div className="mx-auto mt-10 max-w-[800px] px-4">
        <p className="text-center text-3xl font-medium text-slate-600">
          Your access to Earn has been restricted. Please get in touch with{' '}
          <Link
            className="text-brand-purple"
            href="mailto:support@superteam.fun"
          >
            support@superteam.fun
          </Link>{' '}
          if you have any questions for more information.
        </p>
      </div>
    </Default>
  );
}
