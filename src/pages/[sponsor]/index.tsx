import { type GetServerSideProps } from 'next';
import Head from 'next/head';

import { exclusiveSponsorData } from '@/constants/exclusiveSponsors';
import { type SponsorType } from '@/interface/sponsor';
import { Default } from '@/layouts/Default';
import { prisma } from '@/prisma';
import { getURL } from '@/utils/validUrl';

interface Props {
  slug: string;
  title: string;
  description: string;
  sponsor: SponsorType;
}
const SponsorListingsPage = ({ sponsor, title }: Props) => {
  const logo = sponsor.logo;
  const sSlug = sponsor.slug;

  const ogImage = new URL(`${getURL()}api/dynamic-og/sponsor/`);
  ogImage.searchParams.set('logo', logo || '');
  ogImage.searchParams.set('title', title || '');
  ogImage.searchParams.set('slug', sSlug || '');

  return (
    <Default
      className="bg-white"
      hideFooter
      meta={
        <Head>
          <title>{`${title} Opportunities | Superteam Earn`}</title>
          <meta
            name="description"
            content={`
Check out all of ${title}’s latest earning opportunities on a single page.
`}
          />

          <meta property="og:title" content={`${title} on Superteam Earn`} />
          <meta property="og:image" content={ogImage.toString()} />
          <meta name="twitter:title" content={`${title} on Superteam Earn`} />
          <meta name="twitter:image" content={ogImage.toString()} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta
            property="og:image:alt"
            content={`${title} on Superteam Earn`}
          />

          <meta charSet="UTF-8" key="charset" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1"
            key="viewport"
          />
        </Head>
      }
    >
      redirecting...
    </Default>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params } = context;

  const sponsorSlug = params?.sponsor;

  if (typeof sponsorSlug !== 'string') {
    return {
      notFound: true,
    };
  }
  const sponsorExlusiveInfo = exclusiveSponsorData[sponsorSlug as string];
  if (!sponsorExlusiveInfo) {
    return {
      notFound: true,
    };
  }

  const sponsorInfo = await prisma.sponsors.findUnique({
    where: {
      name: sponsorExlusiveInfo.title,
    },
  });

  if (!sponsorInfo) {
    return {
      notFound: true,
    };
  }

  return {
    redirect: {
      destination: `/s/${sponsorInfo.slug}`,
      permanent: true,
    },
  };
};

export default SponsorListingsPage;
