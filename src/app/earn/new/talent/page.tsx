import * as Effect from 'effect/Effect';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { Default } from '@/layouts/Default';
import { ResumingPage } from '@/lib/auth/resume-session';
import { pageMetadata } from '@/lib/metadata';
import { safeNext, signInHref } from '@/lib/safe-next';
import { canResume, getViewer } from '@/lib/session';
import { runtime } from '@/server/runtime';
import * as TalentDirectory from '@/server/talent-directory';

import { NewTalent } from './new-talent';

export const metadata = pageMetadata({
  title: 'Create Your Profile to Access Bounties & Grants | Superteam Earn',
  description:
    "Become part of Superteam's talent network, where you can present your skills and collaborate on various crypto bounties, grants, and projects.",
  canonical: 'https://superteam.fun/earn/new/talent/',
});

// Vercel's guess at the visitor's country; none locally.
async function requestCountry(): Promise<string | null> {
  const code = (await headers()).get('x-vercel-ip-country')?.trim();
  return code && code.toUpperCase() !== 'XX' ? code : null;
}

export default async function NewTalentPage({
  searchParams,
}: PageProps<'/earn/new/talent'>) {
  const [viewer, query] = await Promise.all([getViewer(), searchParams]);
  if (!viewer) {
    const search = new URLSearchParams();
    for (const key of ['originUrl', 'type'] as const) {
      const value = query[key];
      if (typeof value === 'string') search.set(key, value);
    }
    const here = `/earn/new/talent/${search.size ? `?${search.toString()}` : ''}`;
    if (await canResume()) {
      return (
        <Default>
          <ResumingPage signIn={signInHref(here)} />
        </Default>
      );
    }
    redirect(signInHref(here));
  }
  if (viewer.isTalentFilled) {
    const originUrl = query.originUrl;
    redirect(typeof originUrl === 'string' ? safeNext(originUrl) : '/earn/');
  }

  const countryCode = await requestCountry();
  const [suggestedUsername, stats] = await Promise.all([
    viewer.username
      ? null
      : runtime.runPromise(
          TalentDirectory.TalentDirectory.use((directory) =>
            directory.randomUsername(viewer.firstName),
          ).pipe(Effect.orElseSucceed(() => null)),
        ),
    runtime.runPromise(
      TalentDirectory.TalentDirectory.use((directory) =>
        directory.onboardingStats(countryCode),
      ).pipe(
        Effect.orElseSucceed(() => ({
          totalUsers: 0,
          totalInUSD: 0,
          liveUsdValue: 0,
          chapter: null,
        })),
      ),
    ),
  ]);

  return (
    <Default>
      <NewTalent
        suggestedUsername={suggestedUsername}
        countryCode={countryCode}
        stats={stats}
      />
    </Default>
  );
}
