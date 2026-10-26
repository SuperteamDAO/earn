import { ResumingPage } from '@/lib/auth/resume-session';
import { pageMetadata } from '@/lib/metadata';
import { signInHref } from '@/lib/safe-next';
import { canResume, getViewer } from '@/lib/session';
import { runtime } from '@/server/runtime';
import * as TeamInvites from '@/server/team-invites';

import { AcceptInvite, GoHome, SponsorLogo } from './accept-invite';

export const metadata = pageMetadata({
  title: 'Superteam Earn | Work to Earn in Crypto',
  description:
    'Explore the latest bounties on Superteam Earn, offering opportunities in the crypto space across Design, Development, and Content.',
  noIndex: true,
});

// A team invite's link (`?invite=`), from the email Earn sent: who invited
// them to which sponsor, and the way to accept.
export default async function SignupPage(props: PageProps<'/earn/signup'>) {
  const { invite } = await props.searchParams;
  // Earn's links once carried a second `?` after the token.
  const token = ([invite ?? []].flat()[0] ?? '').split('?')[0] ?? '';
  const here = `/earn/signup/?invite=${encodeURIComponent(token)}`;

  const [details, viewer] = await Promise.all([
    token
      ? runtime.runPromise(
          TeamInvites.TeamInvites.use((invites) => invites.details(token)),
        )
      : null,
    getViewer(),
  ]);

  if (!details) {
    return (
      <div className="container flex justify-center">
        <div className="mt-10 flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold">Invitation Error</h1>
          <p>Invalid or expired invitation</p>
          <GoHome />
        </div>
      </div>
    );
  }

  if (!viewer && (await canResume())) {
    return <ResumingPage signIn={signInHref(here)} />;
  }

  return (
    <div className="container mx-auto flex max-w-xl justify-center">
      <div className="mt-10 w-full rounded-lg border border-gray-200 bg-white px-20 pt-20 pb-40 shadow-lg">
        <div className="flex flex-col items-center">
          <p className="text-center text-2xl font-semibold text-slate-600">
            Welcome to Superteam Earn
          </p>
          <p className="mb-6 text-center text-lg text-slate-400">
            Start your journey to access top global talent!
          </p>

          {details.sponsorLogo && details.sponsorName ? (
            <div>
              <SponsorLogo
                logo={details.sponsorLogo}
                name={details.sponsorName}
              />
            </div>
          ) : null}

          <p className="text-center text-xl font-medium text-slate-800">
            {details.senderName} has invited you to join{' '}
            <span className="font-bold">{details.sponsorName}</span>
          </p>

          <div>
            <AcceptInvite
              token={token}
              next={here}
              signedInEmail={viewer?.email ?? null}
              invitedEmail={details.invitedEmail}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
