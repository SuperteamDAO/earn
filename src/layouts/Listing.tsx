import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { ExternalLink } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { ErrorSection } from '@/components/shared/ErrorSection';
import { type User } from '@/interface/user';
import { Default } from '@/layouts/Default';
import { cn } from '@/utils/cn';
import { getURLSanitized } from '@/utils/getURLSanitized';
import { getURL } from '@/utils/validUrl';

import { Comments } from '@/features/comments/components/Comments';
import { ListingHeader } from '@/features/listings/components/ListingPage/ListingHeader';
import { RightSideBar } from '@/features/listings/components/ListingPage/RightSideBar';
import { submissionCountQuery } from '@/features/listings/queries/submission-count';
import { type Listing } from '@/features/listings/types';
import { getListingTypeLabel } from '@/features/listings/utils/status';
import { bountySnackbarAtom } from '@/features/navbar/components/BountySnackbar';

interface ListingPageProps {
  bounty: Listing | null;
  children: React.ReactNode;
  maxW?: '7xl' | '6xl' | '5xl' | '4xl' | '3xl' | '2xl' | 'xl' | 'lg' | 'md';
  isTemplate?: boolean;
}

export function ListingPageLayout({
  bounty: initialBounty,
  children,
  maxW = '7xl',
  isTemplate = false,
}: ListingPageProps) {
  const [, setBountySnackbar] = useAtom(bountySnackbarAtom);
  const posthog = usePostHog();

  const { data: submissionNumber = 0 } = useQuery(
    submissionCountQuery(initialBounty?.id ?? ''),
  );
  const [commentCount, setCommentCount] = useState(0);
  const iterableSkills = initialBounty?.skills?.map((e) => e.skills) ?? [];

  useEffect(() => {
    if (initialBounty?.type === 'bounty') {
      posthog.capture('open_bounty');
    } else if (initialBounty?.type === 'project') {
      posthog.capture('open_project');
    }
  }, []);

  useEffect(() => {
    if (initialBounty) {
      setBountySnackbar({
        isCaution: initialBounty.sponsor?.isCaution,
        submissionCount: submissionNumber,
        deadline: initialBounty.deadline,
        rewardAmount: initialBounty.rewardAmount,
        type: initialBounty.type,
        isPublished: initialBounty.isPublished,
        status: initialBounty.status,
        sponsorId: initialBounty.sponsorId,
        slug: initialBounty.slug,
      });
    }
  }, [initialBounty, submissionNumber]);

  const encodedTitle = encodeURIComponent(initialBounty?.title || '');
  const ogImage = new URL(`${getURL()}api/dynamic-og/listing/`);

  ogImage.searchParams.set('title', encodedTitle);
  ogImage.searchParams.set(
    'reward',
    initialBounty?.rewardAmount?.toString() || '',
  );
  ogImage.searchParams.set('token', initialBounty?.token || '');
  ogImage.searchParams.set('sponsor', initialBounty?.sponsor?.name || '');
  ogImage.searchParams.set('logo', initialBounty?.sponsor?.logo || '');
  ogImage.searchParams.set('type', initialBounty?.type || '');
  ogImage.searchParams.set(
    'compensationType',
    initialBounty?.compensationType || '',
  );
  ogImage.searchParams.set(
    'minRewardAsk',
    initialBounty?.minRewardAsk?.toString() || '',
  );
  ogImage.searchParams.set(
    'maxRewardAsk',
    initialBounty?.maxRewardAsk?.toString() || '',
  );
  ogImage.searchParams.set(
    'isSponsorVerified',
    initialBounty?.sponsor?.isVerified?.toString() || 'false',
  );

  return (
    <Default
      meta={
        <Head>
          <title>{`${
            initialBounty?.title || 'Apply'
          } by ${initialBounty?.sponsor?.name} | Superteam Earn Listing`}</title>
          <meta
            name="description"
            content={`${getListingTypeLabel(initialBounty?.type ?? 'Listing')} on Superteam Earn | ${
              initialBounty?.sponsor?.name
            } is seeking freelancers and builders ${
              initialBounty?.title
                ? `to work on ${initialBounty.title}`
                : '| Apply Here'
            }`}
          />
          <link
            rel="canonical"
            href={`${getURL()}listing/${initialBounty?.slug}/`}
          />
          <meta
            property="og:title"
            content={`${initialBounty?.title || 'Listing'} | Superteam Earn`}
          />
          <meta property="og:image" content={ogImage.toString()} />
          <meta
            name="twitter:title"
            content={`${initialBounty?.title || 'Listing'} | Superteam Earn`}
          />
          <meta name="twitter:image" content={ogImage.toString()} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content="Superteam Bounty" />
          <meta charSet="UTF-8" key="charset" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1"
            key="viewport"
          />
        </Head>
      }
    >
      <div className="bg-white">
        {initialBounty === null && <ErrorSection />}
        {initialBounty !== null && !initialBounty?.id && (
          <ErrorSection message="Sorry! The bounty you are looking for is not available." />
        )}
        {initialBounty !== null && !!initialBounty?.id && (
          <div className="mx-auto w-full px-2 lg:px-6">
            <div className="mx-auto w-full max-w-7xl">
              <ListingHeader
                isTemplate={isTemplate}
                commentCount={commentCount}
                listing={initialBounty}
              />
              <div
                className={cn(
                  'flex min-h-screen flex-col items-center justify-center gap-0 bg-white md:flex-row md:items-start md:justify-between md:gap-4',
                  maxW,
                )}
              >
                <div className="static top-14 h-full w-full flex-grow md:sticky md:w-[22rem]">
                  <RightSideBar
                    isTemplate={isTemplate}
                    listing={initialBounty}
                    skills={iterableSkills}
                  />
                </div>
                <div className="flex h-full w-full flex-grow flex-col gap-8 border-slate-100 pb-10 md:border-l md:pl-5">
                  <div className="w-full">{children}</div>
                  <div className="flex w-full flex-col items-start md:hidden">
                    <p className="mb-1.5 h-full text-center text-xs font-semibold text-slate-600">
                      SKILLS NEEDED
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {iterableSkills?.map((skill) => (
                        <div
                          className="m-0 rounded-sm bg-slate-100 px-4 py-1 text-sm font-medium text-slate-600"
                          key={skill}
                        >
                          <p className="text-xs">{skill}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {initialBounty.pocSocials && (
                    <div className="flex w-full flex-col items-start md:hidden">
                      <p className="h-full text-center text-xs font-semibold text-slate-600">
                        CONTACT
                      </p>
                      <p>
                        <Link
                          className="ph-no-capture text-xs font-medium text-[#64768b]"
                          href={getURLSanitized(initialBounty.pocSocials)}
                          onClick={() => posthog.capture('reach out_listing')}
                        >
                          Reach out
                          <ExternalLink className="mx-1 mb-1 inline h-3 w-3 text-[#64768b]" />
                        </Link>
                        <span className="text-xs text-slate-500">
                          if you have any questions about this initialBounty
                        </span>
                      </p>
                    </div>
                  )}

                  <Comments
                    isTemplate={isTemplate}
                    isAnnounced={initialBounty?.isWinnersAnnounced ?? false}
                    listingSlug={initialBounty?.slug ?? ''}
                    listingType={initialBounty?.type ?? ''}
                    poc={initialBounty?.poc as User}
                    sponsorId={initialBounty?.sponsorId}
                    isVerified={initialBounty?.sponsor?.isVerified}
                    refId={initialBounty?.id ?? ''}
                    refType="BOUNTY"
                    count={commentCount}
                    setCount={setCommentCount}
                    isDisabled={
                      !initialBounty.isPublished &&
                      initialBounty.status === 'OPEN'
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Default>
  );
}
