import axios from 'axios';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { type Bounty, getBountyTypeLabel } from '@/features/listings';
import { getURL } from '@/utils/validUrl';

interface BountyDetailsProps {
  bounty: Bounty | null;
  url: string;
}

function WinnerBounty({ bounty: initialBounty, url }: BountyDetailsProps) {
  const [bounty] = useState<typeof initialBounty>(initialBounty);
  const router = useRouter();
  console.log('url - ', url);

  useEffect(() => {
    router.push(`${getURL()}listings/${bounty?.type}/${bounty?.slug}/`);
  }, []);

  console.log('id - ', bounty?.id);
  const image = new URL(`${url}api/winners-og/`);
  image.searchParams.set('id', bounty?.id || '');
  image.searchParams.set('rewards', JSON.stringify(bounty?.rewards));
  image.searchParams.set('token', bounty?.token || '');
  image.searchParams.set('logo', url + 'assets/logo/st-earn-white.svg');
  image.searchParams.set('fallback', url + 'assets/fallback/avatar.png');

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
        content="width=device-width,initial-scale=1"
        key="viewport"
      />
    </Head>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug, type } = context.query;
  const { req } = context;
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const fullUrl = `${protocol}://${host}/`;

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
      url: fullUrl,
    },
  };
};

export default WinnerBounty;
