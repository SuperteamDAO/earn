import { useQuery } from '@tanstack/react-query';
import { type GetServerSideProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';

import { LinkTextParser } from '@/components/shared/LinkTextParser';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { LocalImage } from '@/components/ui/local-image';
import { Skeleton } from '@/components/ui/skeleton';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { PROJECT_NAME } from '@/constants/project';
import { type SponsorType } from '@/interface/sponsor';
import { Default } from '@/layouts/Default';
import { prisma } from '@/prisma';
import { getURL } from '@/utils/validUrl';

import { ListingTabs } from '@/features/listings/components/ListingTabs';
import {
  Discord,
  GitHub,
  Linkedin,
  Telegram,
  Twitter,
  Website,
} from '@/features/social/components/SocialIcons';
import { sponsorListingsQuery } from '@/features/sponsor-dashboard/queries/sponsor-listings';

interface Props {
  slug: string;
  title: string;
  description: string;
  sponsor: SponsorType;
  industry: string[];
}

// Marketing Banner Component
const MarketingBanner = ({
  banner,
  isLoading,
}: {
  banner?: string;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return <Skeleton className="h-32 w-full md:h-64 md:rounded-md" />;
  }

  return (
    <Image
      width={848}
      height={220}
      className="h-full min-h-[100px] w-full md:rounded-t-2xl"
      alt="Sponsor banner"
      src={banner ?? `${ASSET_URL}/bg/sponsor-cover/Banner.svg`}
    />
  );
};

const SponsorListingsPage = ({
  slug,
  sponsor,
  title,
  description,
  industry,
}: Props) => {
  const { data: listings, isLoading: isListingsLoading } = useQuery(
    sponsorListingsQuery({ sponsor: slug }),
  );

  const { data: sponsorships, isLoading: isSponsorshipsLoading } = useQuery(
    sponsorListingsQuery({ sponsor: slug, type: 'sponsorship' }),
  );

  const logo = sponsor.logo;
  const url = sponsor.url;
  const isVerified = sponsor.isVerified;
  const sSlug = sponsor.slug;
  const banner = sponsor.banner;

  const socialLinks = [
    { Icon: Website, link: url },
    { Icon: Twitter, link: sponsor.twitter },
    { Icon: Linkedin, link: sponsor.linkedin },
    { Icon: GitHub, link: sponsor.github },
    { Icon: Discord, link: sponsor.discord },
    { Icon: Telegram, link: sponsor.telegram },
  ];

  const ogImage = new URL(`${getURL()}api/dynamic-og/sponsor/`);
  ogImage.searchParams.set('logo', logo || '');
  ogImage.searchParams.set('title', title || '');
  ogImage.searchParams.set('slug', sSlug || '');
  ogImage.searchParams.set('banner', banner || '');

  return (
    <Default
      className="bg-white"
      meta={
        <Head>
          <title>{`${title} Opportunities | ${PROJECT_NAME}`}</title>
          <meta
            name="description"
            content={`
Check out all of ${title}'s latest earning opportunities on a single page.
`}
          />
          <meta property="og:title" content={`${title} on ${PROJECT_NAME}`} />
          <meta property="og:image" content={ogImage.toString()} />
          <meta name="twitter:title" content={`${title} on ${PROJECT_NAME}`} />
          <meta name="twitter:image" content={ogImage.toString()} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta
            property="og:image:alt"
            content={`${title} on ${PROJECT_NAME}`}
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
      <div className="flex flex-col items-center justify-center">
        <div className="w-full max-w-[880px]">
          <div className="mx-auto max-w-6xl md:pt-8">
            <div className="relative mb-[72px] md:mb-[88px]">
              <MarketingBanner banner={banner} isLoading={isListingsLoading} />

              <div className="absolute bottom-0 left-4 flex translate-y-[85%] gap-3 md:left-6 md:translate-y-3/4 md:gap-6">
                {isListingsLoading ? (
                  <Skeleton className="h-20 w-20 rounded-full border-4 border-white bg-white md:h-28 md:w-28" />
                ) : (
                  <div className="relative rounded-lg border-2 border-white bg-white shadow-lg">
                    <LocalImage
                      className="h-20 w-20 rounded-lg object-cover md:h-28 md:w-28"
                      alt="Category icon"
                      src={logo!}
                    />
                  </div>
                )}

                <div className="flex flex-col justify-start gap-1 pt-7 md:gap-2 md:pt-12">
                  {isListingsLoading ? (
                    <Skeleton className="h-4 max-w-48" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="max-w-56 truncate text-2xl font-semibold md:max-w-full md:text-3xl">
                        {title}
                      </p>
                      {!!isVerified && <VerifiedBadge className="h-4 w-4" />}
                    </div>
                  )}
                  {isListingsLoading ? (
                    <Skeleton className="h-3 w-24" />
                  ) : (
                    <p className="text-sm text-slate-500">@{sSlug}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex px-4 md:px-6">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-[10] py-3 md:flex-row md:gap-8 md:py-8">
              <div className="w-full md:w-[80%]">
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
                <div className="mt-4 flex w-full flex-wrap gap-3">
                  {industry.map((industryItem: any, index: number) => {
                    return industryItem ? (
                      <div
                        key={index}
                        className="rounded bg-[#EFF1F5] px-3 py-1 text-sm font-medium text-[#64739C]"
                      >
                        {industryItem}
                      </div>
                    ) : null;
                  })}
                </div>

                <div className="mt-4 flex gap-3 text-slate-500">
                  {socialLinks
                    .filter(({ link }) => link)
                    .map(({ Icon, link }, i) => {
                      return <Icon link={link} className="h-4 w-4" key={i} />;
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[880px] bg-white">
          <div className="mx-auto mt-6 px-4 pb-20 md:mt-8 md:px-6">
            {/* Only show tabs if there are bounties, otherwise show empty state */}
            {!isListingsLoading &&
            !isSponsorshipsLoading &&
            !listings?.bounties?.length &&
            !sponsorships?.bounties?.length ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <div className="text-center">
                  <ExternalImage
                    className="mx-auto w-32"
                    alt={'talent empty'}
                    src={'/bg/talent-empty.svg'}
                  />
                  <p className="mt-8 text-lg font-medium text-slate-600">
                    No listings yet
                  </p>
                  <p className="mt-2 text-slate-500">
                    {title} hasn&apos;t posted any earning opportunities or
                    sponsorships yet.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {(listings?.bounties?.length || isListingsLoading) && (
                  <ListingTabs
                    bounties={listings?.bounties}
                    isListingsLoading={isListingsLoading}
                    title="Earning Opportunities"
                    showNotifSub={false}
                  />
                )}

                {(sponsorships?.bounties?.length || isSponsorshipsLoading) && (
                  <ListingTabs
                    bounties={sponsorships?.bounties}
                    isListingsLoading={isSponsorshipsLoading}
                    title="Sponsorships"
                  />
                )}
              </>
            )}
          </div>
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

  let sponsorInfo;
  try {
    sponsorInfo = await prisma.sponsors.findUnique({
      where: {
        slug: sponsorSlug,
        isArchived: false,
      },
    });
  } catch (error) {
    console.error(error);
  }

  if (!sponsorInfo) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      slug: (sponsorSlug as string).toLowerCase(),
      sponsor: JSON.parse(JSON.stringify(sponsorInfo)),
      title: sponsorInfo?.name,
      description: sponsorInfo?.bio || '',
      industry: sponsorInfo.industry.split(',') || [],
    },
  };
};

export default SponsorListingsPage;
