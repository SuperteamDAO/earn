import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type React from 'react';

import { cn } from '@/utils/cn';
import { getURL } from '@/utils/validUrl';

import { Comments } from '@/features/comments/components/Comments';
import { ListingHeader } from '@/features/listings/components/ListingPage/ListingHeader';
import { RightSideBar } from '@/features/listings/components/ListingPage/RightSideBar';
import { listingDetailsQuery } from '@/features/listings/queries/listing-details';

import { ListingAnalytics } from './listing-analytics';
import { getListing, listingQueryKey } from './queries';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const listing = await getListing(params.slug);

  const ogImage = new URL(`${getURL()}api/dynamic-og/listing/`);
  ogImage.searchParams.set('title', encodeURIComponent(listing.title || ''));
  ogImage.searchParams.set('reward', listing.rewardAmount?.toString() || '');
  ogImage.searchParams.set('token', listing.token || '');
  ogImage.searchParams.set('sponsor', listing.sponsor?.name || '');
  ogImage.searchParams.set('logo', listing.sponsor?.logo || '');
  ogImage.searchParams.set('type', listing.type || '');
  ogImage.searchParams.set('compensationType', listing.compensationType || '');
  ogImage.searchParams.set(
    'minRewardAsk',
    listing.minRewardAsk?.toString() || '',
  );
  ogImage.searchParams.set(
    'maxRewardAsk',
    listing.maxRewardAsk?.toString() || '',
  );
  ogImage.searchParams.set(
    'isSponsorVerified',
    listing.sponsor?.isVerified?.toString() || 'false',
  );

  return {
    title: `${listing.title || 'Apply'} by ${listing.sponsor?.name} | Superteam Earn Listing`,
    description: `${listing.type ?? 'Listing'} on Superteam Earn | ${listing.sponsor?.name} is seeking freelancers and builders ${
      listing.title ? `to work on ${listing.title}` : '| Apply Here'
    }`,
    openGraph: {
      title: `${listing.title || 'Listing'} | Superteam Earn`,
      images: [
        {
          url: ogImage.toString(),
          width: 1200,
          height: 630,
          alt: 'Superteam Bounty',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${listing.title || 'Listing'} | Superteam Earn`,
      images: [ogImage.toString()],
    },
  };
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const queryClient = new QueryClient();

  try {
    await queryClient.prefetchQuery(listingDetailsQuery(params.slug));

    const listing = queryClient.getQueryData(listingQueryKey(params.slug));

    if (!listing) {
      notFound();
    }

    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <div className="bg-white">
          <div className="mx-auto w-full px-2 lg:px-6">
            <div className="mx-auto w-full max-w-7xl">
              <ListingAnalytics />
              <ListingHeader />
              <div
                className={cn(
                  'flex min-h-screen flex-col items-center justify-center gap-0 bg-white md:flex-row md:items-start md:justify-between md:gap-4',
                  'max-w-7xl',
                )}
              >
                <div className="static top-14 h-full w-full flex-grow md:sticky md:w-[22rem]">
                  <RightSideBar />
                </div>
                <div className="flex h-full w-full flex-grow flex-col gap-8 border-slate-100 pb-10 md:border-l md:pl-5">
                  {children}
                  <Comments />
                </div>
              </div>
            </div>
          </div>
        </div>
      </HydrationBoundary>
    );
  } catch (error) {
    notFound();
  }
}
