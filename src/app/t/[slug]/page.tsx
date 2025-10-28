import type { Metadata } from 'next';

import { Default } from '@/layouts/Default';
import { prisma } from '@/prisma';
import { getURL } from '@/utils/validUrl';

import { TalentProfileClient } from '@/features/talent/components/TalentProfileClient';

interface PageProps {
  readonly params: Promise<{ slug: string }>;
}

type TalentSelection = {
  id: string;
  twitter: string | null;
  linkedin: string | null;
  github: string | null;
  website: string | null;
  username: string | null;
  workPrefernce: string | null;
  firstName: string | null;
  lastName: string | null;
  skills: unknown | null;
  photo: string | null;
  currentEmployer: string | null;
  location: string | null;
};

async function fetchTalentAndStats(username: string): Promise<{
  talent: TalentSelection | null;
  stats: { wins: number; participations: number; totalWinnings: number };
}> {
  const talent = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      twitter: true,
      linkedin: true,
      github: true,
      website: true,
      username: true,
      workPrefernce: true,
      firstName: true,
      lastName: true,
      skills: true,
      photo: true,
      currentEmployer: true,
      location: true,
    },
  });

  if (!talent) {
    return {
      talent: null,
      stats: { wins: 0, participations: 0, totalWinnings: 0 },
    };
  }

  const userId = talent.id;
  const [participations, wins, listingAgg, grantAgg] = await Promise.all([
    prisma.submission.count({ where: { userId } }),
    prisma.submission.count({
      where: {
        userId,
        isWinner: true,
        listing: { isWinnersAnnounced: true },
      },
    }),
    prisma.submission.aggregate({
      where: {
        userId,
        isWinner: true,
        listing: { isWinnersAnnounced: true },
      },
      _sum: { rewardInUSD: true },
    }),
    prisma.grantApplication.aggregate({
      where: {
        userId,
        applicationStatus: { in: ['Approved', 'Completed'] },
      },
      _sum: { approvedAmountInUSD: true },
    }),
  ]);

  const listingWinnings = listingAgg._sum.rewardInUSD || 0;
  const grantWinnings = grantAgg._sum.approvedAmountInUSD || 0;
  const totalWinnings = (listingWinnings || 0) + (grantWinnings || 0);

  return {
    talent,
    stats: { participations, wins, totalWinnings },
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { talent, stats } = await fetchTalentAndStats(slug);

  if (!talent) {
    return {};
  }

  const ogImage = new URL(`${getURL()}api/dynamic-og/talent/`);
  ogImage.searchParams.set(
    'name',
    `${talent.firstName ?? ''} ${talent.lastName ?? ''}`.trim(),
  );
  ogImage.searchParams.set('username', talent.username ?? '');
  ogImage.searchParams.set('skills', JSON.stringify(talent.skills ?? ''));
  ogImage.searchParams.set(
    'totalEarned',
    stats.totalWinnings.toFixed(0) || '0',
  );
  ogImage.searchParams.set('submissionCount', String(stats.participations));
  ogImage.searchParams.set('winnerCount', String(stats.wins));
  ogImage.searchParams.set('photo', talent.photo ?? '');

  const title =
    talent.firstName && talent.lastName
      ? `${talent.firstName} ${talent.lastName} | Superteam Earn Talent`
      : 'Superteam Earn';

  return {
    title,
    openGraph: {
      images: [ogImage.toString()],
      title,
    },
    twitter: {
      card: 'summary_large_image',
      images: [ogImage.toString()],
      title,
    },
  };
}

export default async function TalentProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const { talent, stats } = await fetchTalentAndStats(slug);

  return (
    <Default>
      <TalentProfileClient talent={talent as any} stats={stats} />
    </Default>
  );
}
