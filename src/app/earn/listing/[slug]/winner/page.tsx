import type { Metadata } from 'next';

import { listingWinners } from '@/layouts/Listing';
import { pageMetadata } from '@/lib/metadata';
import { publicEnv } from '@/lib/public-env';
import { sortRank } from '@/utils/rank';

import { BONUS_REWARD_POSITION } from '@/features/listing-builder/constants';
import { getListingTypeLabel } from '@/features/listings/utils/status';

import { listingBySlug } from '../listing-data';
import { ToListing } from './to-listing';

// The winners' card for the share image: placed winners in rank order,
// bonus spots left out.
async function winnersCard(listingId: string) {
  const data = (await listingWinners(listingId)).filter(
    (winner) => winner.winnerPosition !== BONUS_REWARD_POSITION,
  );
  return sortRank(data.map((winner) => winner.winnerPosition || NaN))
    .map((position) =>
      data.find((winner) => winner.winnerPosition === position),
    )
    .filter((winner) => !!winner)
    .map((winner) => ({
      id: winner.id,
      winnerPosition: winner.winnerPosition,
      user: {
        id: winner.user.id,
        firstName: winner.user.firstName,
        lastName: winner.user.lastName,
        photo: winner.user.photo,
      },
    }));
}

export async function generateMetadata({
  params,
}: PageProps<'/earn/listing/[slug]/winner'>): Promise<Metadata> {
  const { slug } = await params;
  const bounty = await listingBySlug(slug, false);
  const submissions = bounty ? await winnersCard(bounty.id) : [];
  const image = new URL(
    'api/dynamic-og/winners/',
    publicEnv.siteUrl.endsWith('/')
      ? publicEnv.siteUrl
      : `${publicEnv.siteUrl}/`,
  );
  image.searchParams.set('id', bounty?.id || '');
  image.searchParams.set('rewards', JSON.stringify(bounty?.rewards));
  image.searchParams.set('token', bounty?.token || '');
  image.searchParams.set('submissions', JSON.stringify(submissions));

  const shareTitle = `${bounty?.title || 'Bounty'} | Superteam Earn`;
  const base = pageMetadata({
    title: `${bounty?.title || 'Apply'} by ${bounty?.sponsor?.name} | Superteam Earn Listing`,
    description: `${getListingTypeLabel(bounty?.type ?? 'Bounty')} on Superteam Earn | ${
      bounty?.sponsor?.name
    } is seeking freelancers and builders ${
      bounty?.title ? `to work on ${bounty.title}` : '| Apply Here'
    }`,
    og: image.toString(),
    noIndex: true,
  });
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      title: shareTitle,
      images: [
        {
          url: image.toString(),
          width: 1200,
          height: 675,
          alt: `Winners announced for ${bounty?.title || 'Listing'} by ${bounty?.sponsor?.name || 'Sponsor'} on Superteam Earn`,
        },
      ],
    },
    twitter: {
      ...base.twitter,
      title: shareTitle,
      site: 'https://superteam.fun/earn',
      creator: '@SuperteamEarn',
      images: [image.toString()],
    },
  };
}

export default async function WinnerPage({
  params,
}: PageProps<'/earn/listing/[slug]/winner'>) {
  const { slug } = await params;
  const bounty = await listingBySlug(slug, false);
  return bounty?.slug ? (
    <ToListing href={`/earn/listing/${bounty.slug}/`} />
  ) : null;
}
