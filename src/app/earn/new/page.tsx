import * as Effect from 'effect/Effect';
import { redirect } from 'next/navigation';

import { Default } from '@/layouts/Default';
import { pageMetadata } from '@/lib/metadata';
import { getViewer } from '@/lib/session';
import { runtime } from '@/server/runtime';
import * as TalentDirectory from '@/server/talent-directory';

import { NewProfileChoice } from './new-profile-choice';

export const metadata = pageMetadata({
  title: 'Make Your Profile | Earn on Superteam | Connect with Crypto Talent',
  description:
    'Join Superteam to engage with top talent and discover bounties and grants for your crypto projects.',
  canonical: 'https://superteam.fun/earn/new/',
});

export default async function NewProfilePage({
  searchParams,
}: PageProps<'/earn/new'>) {
  const [viewer, query] = await Promise.all([getViewer(), searchParams]);
  // Signed out, both choices show (each goes to sign-in first).
  const showTalentProfile = !viewer?.isTalentFilled;
  if (query.onboarding === 'true' && viewer?.isTalentFilled) {
    redirect('/earn/');
  }
  const totalUsers = await runtime.runPromise(
    TalentDirectory.TalentDirectory.use(
      (directory) => directory.userCount,
    ).pipe(Effect.orElseSucceed((): number | null => null)),
  );
  return (
    <Default>
      <NewProfileChoice
        showTalentProfile={showTalentProfile}
        totalUsers={totalUsers}
      />
    </Default>
  );
}
