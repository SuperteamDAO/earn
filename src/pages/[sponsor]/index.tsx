import { useQuery } from '@tanstack/react-query';
import { type GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FaXTwitter } from 'react-icons/fa6';
import { MdOutlineInsertLink } from 'react-icons/md';

import { LinkTextParser } from '@/components/shared/LinkTextParser';
import { Loading } from '@/components/shared/Loading';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { LocalImage } from '@/components/ui/local-image';
import { Skeleton } from '@/components/ui/skeleton';
import { exclusiveSponsorData } from '@/constants/exclusiveSponsors';
import { GrantsCard } from '@/features/grants';
import { ListingSection, ListingTabs } from '@/features/listings';
import {
  sponsorGrantsQuery,
  sponsorListingsQuery,
} from '@/features/sponsor-dashboard';
import { type SponsorType } from '@/interface/sponsor';
import { Default } from '@/layouts/Default';
import { prisma } from '@/prisma';
import { getTwitterUrl, getURLSanitized } from '@/utils/getURLSanitized';
import { getURL } from '@/utils/validUrl';

interface Props {
  slug: string;
  title: string;
  description: string;
  sponsor: SponsorType;
}
const SponsorListingsPage = ({ slug, sponsor, title, description }: Props) => {
  const { data: listings, isLoading: isListingsLoading } = useQuery(
    sponsorListingsQuery(slug),
  );

  const { data: grants, isLoading: isGrantsLoading } = useQuery(
    sponsorGrantsQuery(slug),
  );

  const logo = sponsor.logo;
  const url = sponsor.url;
  const twitter = sponsor.twitter;
  const isVerified = sponsor.isVerified;
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
            content="width=device-width,initial-scale=1"
            key="viewport"
          />
        </Head>
      }
    >
      <div className="flex bg-[#f8fafc] px-4">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-[10] py-14 md:flex-row">
          {isListingsLoading ? (
            <Skeleton className="h-28 w-28 rounded-full" />
          ) : (
            <div className="justify-center rounded-full">
              <LocalImage
                className="h-28 w-28 rounded-full"
                alt="Category icon"
                src={logo!}
              />
            </div>
          )}

          <div className="w-full md:w-[80%]">
            {isListingsLoading ? (
              <Skeleton className="mt-4 h-4 w-48 md:mt-0" />
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-xl font-semibold">{title}</p>
                {!!isVerified && (
                  <VerifiedBadge
                    style={{
                      width: '1rem',
                      height: '1rem',
                    }}
                  />
                )}
              </div>
            )}
            {isListingsLoading ? (
              <Skeleton className="mt-3 h-3 w-24" />
            ) : (
              <p className="max-w-[600px] text-slate-500">@{sSlug}</p>
            )}
            {isListingsLoading ? (
              <div className="mt-2 space-y-2">
                <Skeleton className="h-3 w-[600px]" />
                <Skeleton className="h-3 w-[500px]" />
              </div>
            ) : (
              <LinkTextParser
                className="mt-2 text-slate-600"
                text={description}
              />
            )}
            <div className="mt-3 flex gap-3 text-[#64748B]">
              {url && (
                <Link className="flex items-center" href={getURLSanitized(url)}>
                  <MdOutlineInsertLink className="h-5 w-5" />
                </Link>
              )}
              {twitter && (
                <Link
                  className="flex items-center"
                  href={getTwitterUrl(twitter)}
                >
                  <FaXTwitter className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full bg-white">
        <div className="mx-auto max-w-5xl px-4 pb-20">
          <ListingTabs
            bounties={listings?.bounties}
            isListingsLoading={isListingsLoading}
            title="Earning Opportunities"
            take={20}
            showNotifSub={false}
          />
          {!!grants && !!grants.length && (
            <ListingSection
              type="grants"
              title={`Grants`}
              sub="Equity-free funding opportunities for builders"
            >
              {isGrantsLoading && (
                <div className="flex min-h-52 flex-col items-center justify-center">
                  <Loading />
                </div>
              )}
              {!isGrantsLoading &&
                grants?.map((grant) => (
                  <GrantsCard grant={grant} key={grant.id} />
                ))}
            </ListingSection>
          )}
        </div>
      </div>
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

  return {
    props: {
      slug: (sponsorSlug as string).toLowerCase(),
      sponsor: JSON.parse(JSON.stringify(sponsorInfo)),
      title: sponsorExlusiveInfo.title,
      description: sponsorExlusiveInfo.description,
    },
  };
};

export default SponsorListingsPage;
