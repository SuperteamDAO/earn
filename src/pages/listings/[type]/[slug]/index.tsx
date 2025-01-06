import axios from 'axios';
import type { GetServerSideProps } from 'next';

import { ListingPageLayout } from '@/layouts/Listing';
import { getURL } from '@/utils/validUrl';

import { ListingPop } from '@/features/conversion-popups/components/ListingPop';
import { DescriptionUI } from '@/features/listings/components/ListingPage/DescriptionUI';
import { ListingWinners } from '@/features/listings/components/ListingPage/ListingWinners';
import { type Listing } from '@/features/listings/types';

interface BountyDetailsProps {
  bounty: Listing | null;
}

function BountyDetails({ bounty: bounty }: BountyDetailsProps) {
  return (
    <ListingPageLayout bounty={bounty}>
      <ListingPop listing={bounty} />
      {bounty?.isWinnersAnnounced && (
        <div className="mt-6 hidden w-full md:block">
          <ListingWinners bounty={bounty} />
        </div>
      )}
      <DescriptionUI description={bounty?.description} />
    </ListingPageLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug, type } = context.query;
  const { req } = context;
  const host = req.headers.host || '';

  const redirectToEarnSlugs = [
    'write-a-twitter-thread-about-airspaces',
    'twitter-thread-neon-points-program',
    'video-neon-points-program',
  ];

  if (
    redirectToEarnSlugs.includes(slug as string) &&
    !host.includes('earn.superteam.fun')
  ) {
    return {
      redirect: {
        destination: `https://earn.superteam.fun/listings/${type}/${slug}`,
        permanent: false,
      },
    };
  }

  if (slug === 'synthernet-radar') {
    return {
      redirect: {
        destination: `https://earn.superteam.fun/listings/hackathon/synternet-radar/`,
        permanent: false,
      },
    };
  }

  if (slug === '100xdevs-solana-mini-hackathon-1' && type === 'project') {
    return {
      redirect: {
        destination: `https://earn.superteam.fun/listings/bounty/${slug}`,
        permanent: false,
      },
    };
  }

  if (
    slug === 'contribute-to-the-solana-ai-agent-toolkit-part-2' &&
    type === 'project'
  ) {
    return {
      redirect: {
        destination: `https://earn.superteam.fun/listings/bounty/contribute-to-the-solana-ai-agent-toolkit-part-2`,
        permanent: false,
      },
    };
  }

  let bountyData;
  try {
    const bountyDetails = await axios.get(
      `${getURL()}api/listings/details/${slug}`,
      {
        params: { type },
      },
    );
    bountyData = bountyDetails.data;
  } catch (e) {
    console.error(e);
    bountyData = null;
  }

  return {
    props: {
      bounty: bountyData,
    },
  };
};
export default BountyDetails;
