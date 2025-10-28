'use client';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { SubmissionWithUser } from '@/interface/submission';
import { getWinningSubmissionsByListingId } from '@/pages/api/listings/[listingId]/winners';
import { getListingDetailsBySlug } from '@/pages/api/listings/details/[slug]';
import { sortRank } from '@/utils/rank';
import { getURL } from '@/utils/validUrl';

import { BONUS_REWARD_POSITION } from '@/features/listing-builder/constants';
import { type Listing, type Rewards } from '@/features/listings/types';
import { getListingTypeLabel } from '@/features/listings/utils/status';

interface BountyDetailsProps {
  bounty: Listing | null;
  url: string;
  submissions: SubmissionWithUser[];
}

function WinnerBounty({
  bounty: initialBounty,
  url,
  submissions,
}: BountyDetailsProps) {
  const [bounty] = useState<typeof initialBounty>(initialBounty);
  const router = useRouter();

  useEffect(() => {
    router.push(`${getURL()}listing/${bounty?.slug}/`);
  }, []);

  const image = new URL(`${url}api/dynamic-og/winners/`);
  image.searchParams.set('id', bounty?.id || '');
  image.searchParams.set('rewards', JSON.stringify(bounty?.rewards));
  image.searchParams.set('token', bounty?.token || '');
  image.searchParams.set('submissions', JSON.stringify(submissions));

  return (
    <Head>
      <title>{`${
        initialBounty?.title || 'Apply'
      } by ${initialBounty?.sponsor?.name} | Superteam Earn Listing`}</title>
      <meta
        name="description"
        content={`${getListingTypeLabel(initialBounty?.type ?? 'Bounty')} on Superteam Earn | ${
          initialBounty?.sponsor?.name
        } is seeking freelancers and builders ${
          initialBounty?.title
            ? `to work on ${initialBounty.title}`
            : '| Apply Here'
        }`}
      />
      <link rel="canonical" href={`${getURL()}listing/${bounty?.slug}/`} />
      <meta property="og:image" content={`${image.toString()}`} />
      <meta
        property="og:title"
        content={`${initialBounty?.title || 'Bounty'} | Superteam Earn`}
      />
      <meta
        name="twitter:title"
        content={`${initialBounty?.title || 'Bounty'} | Superteam Earn`}
      />
      <meta name="twitter:site" content="https://earn.superteam.fun" />
      <meta name="twitter:creator" content="@SuperteamEarn" />
      <meta name="twitter:image" content={`${image.toString()}`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="675" />
      <meta property="og:image:alt" content="Superteam Bounty" />
      <meta charSet="UTF-8" key="charset" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1"
        key="viewport"
      />
    </Head>
  );
}

interface StrippedSubmission {
  id: string;
  winnerPosition: keyof Rewards | undefined;
  user: {
    firstName: string | undefined;
    lastName: string | undefined;
    photo: string | undefined;
  };
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  const { req } = context;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const fullUrl = `${protocol}://${host}/`;

  let bountyData;
  const submissions: StrippedSubmission[] = [];
  try {
    bountyData = await getListingDetailsBySlug(String(slug));

    let data = await getWinningSubmissionsByListingId(String(bountyData.id));
    data = data.filter((d) => d.winnerPosition !== BONUS_REWARD_POSITION);
    const winners = sortRank(
      data.map((submission) => submission.winnerPosition || NaN),
    );
    const sortedSubmissions = winners.map((position) =>
      data.find((d: SubmissionWithUser) => d.winnerPosition === position),
    ) as SubmissionWithUser[];
    sortedSubmissions.forEach((s) => {
      submissions.push({
        id: s.id,
        winnerPosition: s.winnerPosition,
        user: {
          firstName: s.user.firstName,
          lastName: s.user.lastName,
          photo: s.user.photo,
        },
      });
    });
  } catch (e) {
    console.error(e);
    bountyData = null;
  }

  return {
    props: {
      bounty: bountyData,
      url: fullUrl,
      submissions,
    },
  };
};

export default WinnerBounty;
