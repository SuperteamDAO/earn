import axios from 'axios';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { type Bounty, getBountyTypeLabel } from '@/features/listings';
import { getURL } from '@/utils/validUrl';

interface BountyDetailsProps {
  bounty: Bounty | null;
}

function WinnerBounty({ bounty: initialBounty }: BountyDetailsProps) {
  const [bounty] = useState<typeof initialBounty>(initialBounty);
  const router = useRouter();

  useEffect(() => {
    router.push(`${getURL()}listings/${bounty?.type}/${bounty?.slug}/`);
  }, []);

  return (
    <Head>
      <title>{`Superteam Earn Bounty | ${
        initialBounty?.title || 'Apply'
      } by ${initialBounty?.sponsor?.name}`}</title>
      <meta
        name="description"
        content={`${getBountyTypeLabel(initialBounty?.type ?? 'Bounty')} on Superteam Earn | ${
          initialBounty?.sponsor?.name
        } is seeking freelancers and builders ${
          initialBounty?.title
            ? `to work on ${initialBounty.title}`
            : '| Apply Here'
        }`}
      />
      <link
        rel="canonical"
        href={`${getURL()}listings/${bounty?.type}/${bounty?.slug}/`}
      />
      <meta property="og:image" content={bounty?.winnerBannerUrl} />
      <meta name="twitter:image" content={bounty?.winnerBannerUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="675" />
      <meta property="og:image:alt" content="Superteam Bounty" />
      <meta charSet="UTF-8" key="charset" />
      <meta
        name="viewport"
        content="width=device-width,initial-scale=1"
        key="viewport"
      />
    </Head>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug, type } = context.query;

  let bountyData;
  try {
    const bountyDetails = await axios.get(`${getURL()}api/bounties/${slug}`, {
      params: { type },
    });
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

export default WinnerBounty;
