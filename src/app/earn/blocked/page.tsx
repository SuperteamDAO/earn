import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Default } from '@/layouts/Default';
import { pageMetadata } from '@/lib/metadata';
import { getViewer } from '@/lib/session';

export const metadata = pageMetadata({
  title: 'Blocked | Superteam Earn',
  description:
    'Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content.',
  noIndex: true,
});

export default async function Blocked() {
  const viewer = await getViewer();
  if (viewer && !viewer.isBlocked) redirect('/earn/');

  return (
    <Default>
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
