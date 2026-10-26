import * as Effect from 'effect/Effect';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { Default } from '@/layouts/Default';
import { JsonLdScripts } from '@/layouts/JsonLdScripts';
import { pageMetadata } from '@/lib/metadata';
import { getViewer } from '@/lib/session';
import * as HomeStats from '@/server/home-stats';
import { runtime } from '@/server/runtime';
import * as SponsorPages from '@/server/sponsor-pages';
import {
  generateBreadcrumbListSchema,
  generateSponsorOrganizationSchema,
} from '@/utils/json-ld';
import { getURL } from '@/utils/validUrl';

import { GrantsSection } from '@/features/grants/components/GrantsSection';
import {
  type EmptySectionFilters,
  ListingsSection,
} from '@/features/listings/components/ListingsSection';

import { SponsorEmptySection, SponsorHeader } from './sponsor-parts';

type Props = PageProps<'/earn/s/[slug]'>;

const sponsorOf = cache((slug: string) =>
  runtime.runPromise(
    SponsorPages.SponsorPages.use((pages) => pages.bySlug(slug)),
  ),
);

const ogImageOf = (sponsor: SponsorPages.SponsorPage) => {
  const ogImage = new URL(`${getURL()}api/dynamic-og/sponsor/`);
  ogImage.searchParams.set('logo', sponsor.logo || '');
  ogImage.searchParams.set('title', sponsor.name || '');
  ogImage.searchParams.set('slug', sponsor.slug || '');
  return ogImage.toString();
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const sponsor = await sponsorOf((await params).slug);
  if (!sponsor) return {};
  const og = ogImageOf(sponsor);
  const base = pageMetadata({
    title: `${sponsor.name} Opportunities | Superteam Earn`,
    description: `Check out all of ${sponsor.name}'s latest earning opportunities on a single page.`,
    canonical: `https://superteam.fun/earn/s/${sponsor.slug}/`,
    og,
  });
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      images: [
        {
          url: og,
          width: 1200,
          height: 630,
          alt: `${sponsor.name} on Superteam Earn`,
        },
      ],
    },
  };
}

export default async function SponsorPage({ params, searchParams }: Props) {
  const sponsor = await sponsorOf((await params).slug);
  if (!sponsor) notFound();

  const [viewer, stats, query] = await Promise.all([
    getViewer(),
    runtime.runPromise(
      HomeStats.HomeStats.use((all) => all.sponsorStats(sponsor.id)).pipe(
        Effect.orElseSucceed(() => null),
      ),
    ),
    searchParams,
  ]);
  const isSponsor = viewer?.currentSponsorId === sponsor.id;
  const { twitter, name, slug: sSlug } = sponsor;

  const organizationSchema = generateSponsorOrganizationSchema({
    name: sponsor.name,
    slug: sponsor.slug,
    logo: sponsor.logo ?? undefined,
    url: sponsor.url ?? undefined,
    twitter: sponsor.twitter ?? undefined,
    bio: sponsor.bio ?? undefined,
  });
  const breadcrumbSchema = generateBreadcrumbListSchema([
    { name: 'Home', url: '/' },
    { name: name || 'Sponsor' },
  ]);

  const getTwitterIntentUrl = () => {
    const twitterHandle = twitter ? twitter.split('/').pop() : name;
    const sponsorHandle = `@${twitterHandle}`;
    const message = `Would love to contribute to ${sponsorHandle}\nHow about you add a listing on @SuperteamEarn!`;
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
  };

  const customEmptySection = (filters: EmptySectionFilters) => {
    const isStatusAll = filters.activeStatus === 'all';
    const isTabAll = filters.activeTab === 'all';
    const isCategoryAll = filters.activeCategory === 'All';
    const isDefaultFilters = isStatusAll && isTabAll && isCategoryAll;

    if (isDefaultFilters) {
      if (isSponsor) {
        return (
          <SponsorEmptySection
            title="Create your next listing"
            message="You don't have any listings"
            buttonText="Create Listing"
            buttonHref="/earn/dashboard/listings/?open=1"
          />
        );
      }
      return (
        <SponsorEmptySection
          title="The sponsor has not posted a listing on Earn yet"
          message="you can tweet at them to create some!"
          buttonText="Post on X"
          buttonHref={getTwitterIntentUrl()}
        />
      );
    }

    return (
      <SponsorEmptySection
        title="Zero results for your current filters"
        message="Try resetting the filters"
        buttonText="Reset Filters"
        buttonHref={`/earn/s/${sSlug}/`}
      />
    );
  };

  return (
    <Default className="bg-white" hideFooter>
      <JsonLdScripts data={[organizationSchema, breadcrumbSchema]} />
      <SponsorHeader
        sponsor={sponsor}
        totalRewardAmount={stats?.totalRewardAmount || 0}
        completionRate={stats?.completionRate || 0}
      />

      <div className="w-full bg-white">
        <div className="mx-auto max-w-5xl px-4 pb-20">
          <ListingsSection
            type="sponsor"
            sponsor={sSlug}
            searchParams={query}
            customEmptySection={customEmptySection}
          />
          <GrantsSection
            hideWhenEmpty
            hideCategoryPills
            type="sponsor"
            sponsor={sSlug}
            searchParams={query}
          />
        </div>
      </div>
    </Default>
  );
}
