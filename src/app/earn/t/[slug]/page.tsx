import * as Effect from 'effect/Effect';
import type { Metadata } from 'next';
import { cache } from 'react';
import { preload } from 'react-dom';

import { EmptySection } from '@/components/shared/EmptySection';
import { Default } from '@/layouts/Default';
import { pageMetadata } from '@/lib/metadata';
import { getSession } from '@/lib/session';
import { runtime } from '@/server/runtime';
import * as TalentFeed from '@/server/talent-feed';
import * as TalentProfile from '@/server/talent-profile';
import {
  generateBreadcrumbListSchema,
  generatePersonSchema,
} from '@/utils/json-ld';
import { getURL } from '@/utils/validUrl';

import type { FeedDataProps } from '@/features/feed/types';
import { getWorkPreferenceText } from '@/features/talent/utils/work-preference';

import { TalentProfileView } from './talent-profile';

const loadTalent = cache((username: string) =>
  runtime.runPromise(
    TalentProfile.TalentProfile.use((profiles) =>
      profiles.byUsername(username),
    ).pipe(Effect.orElseSucceed(() => null)),
  ),
);

const fullName = (talent: {
  firstName: string | null;
  lastName: string | null;
}) => `${talent.firstName || ''} ${talent.lastName || ''}`.trim();

export async function generateMetadata({
  params,
}: PageProps<'/earn/t/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadTalent(decodeURIComponent(slug));
  if (!page) {
    return pageMetadata({ title: 'Superteam Earn', description: '' });
  }
  const { talent, stats, shouldNoIndex } = page;
  const isPublicProfile = !talent.private;
  const workPreferenceText = getWorkPreferenceText(talent.workPrefernce);

  const parts: string[] = [];
  const name = fullName(talent);
  if (name) parts.push(name);
  if (workPreferenceText) parts.push(`looking for ${workPreferenceText}`);
  if (talent.currentEmployer) parts.push(`works at ${talent.currentEmployer}`);
  if (talent.location) parts.push(`based in ${talent.location}`);
  const statsStr = `$${Math.round(
    stats.totalWinnings || 0,
  ).toLocaleString()} earned, ${stats.wins || 0} wins on Superteam Earn.`;
  const description = isPublicProfile
    ? parts.length > 0
      ? `${parts.join(' | ')}. ${statsStr}`
      : `Talent profile on Superteam Earn. ${statsStr}`
    : '';

  const og = new URL(`${getURL()}api/dynamic-og/talent/`);
  og.searchParams.set('name', `${talent.firstName} ${talent.lastName}`);
  og.searchParams.set('username', talent.username ?? '');
  og.searchParams.set('skills', JSON.stringify(talent.skills));
  og.searchParams.set('totalEarned', stats.totalWinnings.toFixed(0));
  og.searchParams.set('submissionCount', String(stats.participations));
  og.searchParams.set('winnerCount', String(stats.wins));
  if (talent.photo) og.searchParams.set('photo', talent.photo);

  const title =
    talent.firstName && talent.lastName
      ? `${talent.firstName} ${talent.lastName} | Superteam Earn Talent`
      : 'Superteam Earn';
  const base = pageMetadata({
    title,
    description,
    canonical: isPublicProfile
      ? `https://superteam.fun/earn/t/${talent.username}/`
      : undefined,
    og: og.toString(),
    noIndex: talent.private || shouldNoIndex,
  });
  const alt = isPublicProfile
    ? `${talent.firstName} ${talent.lastName} - Talent profile on Superteam Earn`
    : 'Talent on Superteam';
  return {
    ...base,
    ...(isPublicProfile ? {} : { description: undefined }),
    openGraph: {
      ...base.openGraph,
      ...(isPublicProfile ? {} : { description: undefined }),
      type: 'profile',
      images: [{ url: og.toString(), width: 1200, height: 630, alt }],
    },
    twitter: {
      ...base.twitter,
      title,
      ...(isPublicProfile ? {} : { description: undefined }),
      images: [og.toString()],
    },
  };
}

export default async function TalentProfilePage({
  params,
}: PageProps<'/earn/t/[slug]'>) {
  const { slug } = await params;
  const page = await loadTalent(decodeURIComponent(slug));
  if (!page) {
    return (
      <Default>
        <EmptySection message="Sorry! The profile you are looking for is not available." />
      </Default>
    );
  }
  const { talent, stats, bgIndex } = page;

  // The header background, fetched first (Earn sent these as Link headers).
  const bgNum = bgIndex + 1;
  preload(`/assets/backgrounds/${bgNum}-mobile.avif`, {
    as: 'image',
    type: 'image/avif',
    fetchPriority: 'high',
    media: '(max-width: 639px)',
  });
  preload(`/assets/backgrounds/${bgNum}-desktop.avif`, {
    as: 'image',
    type: 'image/avif',
    fetchPriority: 'high',
    media: '(min-width: 640px)',
  });

  const session = await getSession();
  const feed = await runtime.runPromise(
    TalentFeed.TalentFeed.use((items) =>
      items.list(
        {
          filter: 'new',
          timePeriod: '',
          isWinner: false,
          take: 5,
          skip: 0,
          userId: talent.id,
        },
        session?.userId ?? null,
      ),
    ).pipe(
      Effect.map((items): FeedDataProps[] => [...items]),
      Effect.orElseSucceed((): FeedDataProps[] => []),
    ),
  );

  const isPublicProfile = !talent.private;
  const name = fullName(talent);
  const jsonLd = isPublicProfile
    ? [
        generatePersonSchema({
          firstName: talent.firstName ?? undefined,
          lastName: talent.lastName ?? undefined,
          username: talent.username ?? undefined,
          photo: talent.photo ?? undefined,
          workPreference: getWorkPreferenceText(talent.workPrefernce),
          currentEmployer: talent.currentEmployer ?? undefined,
          location: talent.location ?? undefined,
          skills: talent.skills,
          twitter: talent.twitter ?? undefined,
          linkedin: talent.linkedin ?? undefined,
          github: talent.github ?? undefined,
          website: talent.website ?? undefined,
        }),
        generateBreadcrumbListSchema([
          { name: 'Home', url: '/' },
          { name: name || 'Talent' },
        ]),
      ]
    : null;

  return (
    <Default>
      {jsonLd?.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          // oxlint-disable-next-line react/no-danger -- structured data, escaped below
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, '\\u003c'),
          }}
        />
      ))}
      <TalentProfileView
        talent={talent}
        stats={stats}
        bgIndex={bgIndex}
        initialFeed={feed}
      />
    </Default>
  );
}
