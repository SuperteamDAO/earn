import { Globe, InfoIcon, Pencil } from 'lucide-react';
import { type GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import FaXTwitter from '@/components/icons/FaXTwitter';
import { LinkTextParser } from '@/components/shared/LinkTextParser';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { Button } from '@/components/ui/button';
import { LocalImage } from '@/components/ui/local-image';
import { Separator } from '@/components/ui/separator';
import { Tooltip } from '@/components/ui/tooltip';
import { type SponsorType } from '@/interface/sponsor';
import { Default } from '@/layouts/Default';
import { getSponsorStats, type SponsorStats } from '@/pages/api/sponsors/stats';
import { prisma } from '@/prisma';
import { useUser } from '@/store/user';
import { getURLSanitized } from '@/utils/getURLSanitized';
import { getURL } from '@/utils/validUrl';

import { GrantsSection } from '@/features/grants/components/GrantsSection';
import {
  type EmptySectionFilters,
  ListingsSection,
} from '@/features/listings/components/ListingsSection';

interface Props {
  sponsor: SponsorType;
  stats: SponsorStats | null;
}

const SponsorPage = ({ sponsor, stats }: Props) => {
  console.log('stats', stats);
  const logo = sponsor.logo;
  const url = sponsor.url;
  const twitter = sponsor.twitter;
  const isVerified = sponsor.isVerified;
  const sSlug = sponsor.slug;
  const name = sponsor.name;
  const bio = sponsor.bio;

  const ogImage = new URL(`${getURL()}api/dynamic-og/sponsor/`);
  ogImage.searchParams.set('logo', logo || '');
  ogImage.searchParams.set('title', name || '');
  ogImage.searchParams.set('slug', sSlug || '');

  const { user } = useUser();
  const isSponsor = user?.currentSponsorId === sponsor.id;

  const getTwitterIntentUrl = () => {
    const twitterHandle = twitter ? twitter.split('/').pop() : name;
    const sponsorHandle = `@${twitterHandle}`;
    const message = `Would love to contribute to ${sponsorHandle}\nHow about you add a listing on @SuperteamEarn!`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
  };

  const customEmptySection = (filters: EmptySectionFilters) => {
    const getEmptySectionCopy = () => {
      const isStatusAll = filters.activeStatus === 'all';
      const isTabAll = filters.activeTab === 'all';
      const isCategoryAll = filters.activeCategory === 'All';
      const isDefaultFilters = isStatusAll && isTabAll && isCategoryAll;

      if (isDefaultFilters) {
        if (isSponsor) {
          return {
            title: 'Create your next listing',
            message: "You don't have any listings",
            buttonText: 'Create Listing',
            buttonHref: '/dashboard/listings/?open=1',
          };
        }

        return {
          title: 'The sponsor has not posted a listing on Earn yet',
          message: 'you can tweet at them to create some!',
          buttonText: 'Post on X',
          buttonHref: getTwitterIntentUrl(),
        };
      }

      return {
        title: 'Zero results for your current filters',
        message: 'Try resetting the filters',
        buttonText: 'Reset Filters',
        buttonHref: `/s/${sSlug}`,
      };
    };

    const copy = getEmptySectionCopy();

    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-6 flex h-18 w-18 items-center justify-center rounded-full bg-slate-100">
          <Pencil className="h-8 w-8 text-slate-500" />
        </div>
        <h3 className="mb-2 text-lg leading-[1.2] font-semibold text-slate-700">
          {copy.title}
        </h3>
        <p className="mb-6 text-slate-500">{copy.message}</p>
        <Button variant="default" className="rounded-[0.5rem] px-10" asChild>
          <Link
            href={copy.buttonHref}
            target={copy.buttonHref.startsWith('http') ? '_blank' : undefined}
          >
            {copy.buttonText}
          </Link>
        </Button>
      </div>
    );
  };

  return (
    <Default
      className="bg-white"
      hideFooter
      meta={
        <Head>
          <title>{`${name} Opportunities | Superteam Earn`}</title>
          <meta
            name="description"
            content={`
Check out all of ${name}'s latest earning opportunities on a single page.
`}
          />

          <meta property="og:title" content={`${name} on Superteam Earn`} />
          <meta property="og:image" content={ogImage.toString()} />
          <meta name="twitter:title" content={`${name} on Superteam Earn`} />
          <meta name="twitter:image" content={ogImage.toString()} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content={`${name} on Superteam Earn`} />

          <meta charSet="UTF-8" key="charset" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1"
            key="viewport"
          />
        </Head>
      }
    >
      <div className="flex bg-slate-50 px-4">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-[10] py-14 md:flex-row md:px-4">
          <div className="justify-center rounded-md">
            <LocalImage
              className="size-20 rounded-md"
              alt="Category icon"
              src={logo!}
            />
          </div>

          <div className="w-full md:w-[80%]">
            <div className="flex items-center gap-2">
              <p className="text-xl font-semibold">{name}</p>
              {!!isVerified && (
                <VerifiedBadge
                  style={{
                    width: '1rem',
                    height: '1rem',
                  }}
                />
              )}
            </div>

            {bio && (
              <LinkTextParser
                className="mt-1 font-normal text-slate-500 md:mt-2"
                text={bio}
              />
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
              <span className="flex items-center gap-1">
                <p>
                  $
                  {Intl.NumberFormat('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(stats?.totalRewardAmount || 0)}
                </p>
                <p className="font-medium text-slate-500">Rewarded</p>
                <Separator orientation="vertical" className="ml-1 h-4" />
              </span>
              <span className="flex items-center gap-1">
                <p>{stats?.completionRate.toFixed(0) || 0}%</p>
                <p className="font-medium text-slate-500">Completion Rate</p>
                <Tooltip
                  content={
                    'The number of bounties where winners were announced divided by the total number of eligible bounties published'
                  }
                >
                  <InfoIcon className="h-3 w-3 text-slate-400" />
                </Tooltip>
                <Separator
                  orientation="vertical"
                  className="ml-1 hidden h-4 md:block"
                />
              </span>

              <span className="mt-3 flex w-full basis-full items-center gap-2 md:mt-0 md:w-auto md:basis-auto">
                {twitter && (
                  <Link
                    className="flex items-center"
                    href={twitter}
                    target="_blank"
                  >
                    <FaXTwitter className="h-4 w-4 fill-slate-500" />
                  </Link>
                )}
                {url && (
                  <Link
                    className="flex items-center"
                    href={getURLSanitized(url)}
                    target="_blank"
                  >
                    <Globe className="h-4 w-4 text-slate-500" />
                  </Link>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full bg-white">
        <div className="mx-auto max-w-5xl px-4 pb-20">
          <ListingsSection
            type="sponsor"
            sponsor={sSlug}
            customEmptySection={customEmptySection}
          />
          <GrantsSection hideWhenEmpty type="sponsor" sponsor={sSlug} />
        </div>
      </div>
    </Default>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params } = context;

  const slug = params?.slug;

  if (typeof slug !== 'string') {
    return {
      notFound: true,
    };
  }

  const sponsor = await prisma.sponsors.findUnique({
    where: {
      slug,
    },
  });

  if (!sponsor) {
    return {
      notFound: true,
    };
  }

  const stats = await getSponsorStats(sponsor.id);

  return {
    props: {
      sponsor: JSON.parse(JSON.stringify(sponsor)),
      stats: JSON.parse(JSON.stringify(stats)),
    },
  };
};

export default SponsorPage;
