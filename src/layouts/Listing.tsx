import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { ExternalLink } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import { useEffect, useMemo, useState } from 'react';

import { ErrorSection } from '@/components/shared/ErrorSection';
import { type User } from '@/interface/user';
import { Default } from '@/layouts/Default';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';
import { getURLSanitized } from '@/utils/getURLSanitized';
import { getURL } from '@/utils/validUrl';

import { Comments } from '@/features/comments/components/Comments';
import { ListingHeader } from '@/features/listings/components/ListingPage/ListingHeader';
import { RightSideBar } from '@/features/listings/components/ListingPage/RightSideBar';
import { SubmissionActionButton } from '@/features/listings/components/Submission/SubmissionActionButton';
import { submissionCountQuery } from '@/features/listings/queries/submission-count';
import { type Listing } from '@/features/listings/types';
import { getListingTypeLabel } from '@/features/listings/utils/status';
import { bountySnackbarAtom } from '@/features/navbar/components/BountySnackbar';

interface ListingPageProps {
  listing: Listing | null;
  children: React.ReactNode;
  maxW?: '7xl' | '6xl' | '5xl' | '4xl' | '3xl' | '2xl' | 'xl' | 'lg' | 'md';
  isTemplate?: boolean;
}

export function ListingPageLayout({
  listing: initialListing,
  children,
  maxW = '7xl',
  isTemplate = false,
}: ListingPageProps) {
  const [, setBountySnackbar] = useAtom(bountySnackbarAtom);
  const { user } = useUser();

  const { data: submissionNumber = 0, isLoading: isSubmissionNumberLoading } =
    useQuery(submissionCountQuery(initialListing?.id ?? ''));
  const [commentCount, setCommentCount] = useState(0);
  const iterableSkills = useMemo(
    () => initialListing?.skills?.map((e) => e.skills) ?? [],
    [initialListing?.skills],
  );

  useEffect(() => {
    if (initialListing?.type === 'bounty') {
      posthog.capture('open_bounty');
    } else if (initialListing?.type === 'project') {
      posthog.capture('open_project');
    }
  }, []);

  useEffect(() => {
    if (initialListing) {
      setBountySnackbar({
        isCaution: initialListing.sponsor?.isCaution,
        submissionCount: submissionNumber,
        deadline: initialListing.deadline,
        rewardAmount: initialListing.rewardAmount,
        type: initialListing.type,
        isPublished: initialListing.isPublished,
        status: initialListing.status,
        sponsorId: initialListing.sponsorId,
        slug: initialListing.slug,
      });
    }
  }, [initialListing, submissionNumber, setBountySnackbar]);

  const encodedTitle = encodeURIComponent(initialListing?.title || '');
  const ogImage = new URL(`${getURL()}api/dynamic-og/listing/`);

  ogImage.searchParams.set('title', encodedTitle);
  ogImage.searchParams.set(
    'reward',
    initialListing?.rewardAmount?.toString() || '',
  );
  ogImage.searchParams.set('token', initialListing?.token || '');
  ogImage.searchParams.set('sponsor', initialListing?.sponsor?.name || '');
  ogImage.searchParams.set('logo', initialListing?.sponsor?.logo || '');
  ogImage.searchParams.set('type', initialListing?.type || '');
  ogImage.searchParams.set(
    'compensationType',
    initialListing?.compensationType || '',
  );
  ogImage.searchParams.set(
    'minRewardAsk',
    initialListing?.minRewardAsk?.toString() || '',
  );
  ogImage.searchParams.set(
    'maxRewardAsk',
    initialListing?.maxRewardAsk?.toString() || '',
  );
  ogImage.searchParams.set(
    'isSponsorVerified',
    initialListing?.sponsor?.isVerified?.toString() || 'false',
  );

  const router = useRouter();
  const isSubmissionPage = router.pathname.endsWith('/submission');

  return (
    <Default
      meta={
        <Head>
          <title>{`${
            initialListing?.title || 'Apply'
          } by ${initialListing?.sponsor?.name} | Superteam Earn Listing`}</title>
          <meta
            name="description"
            content={`${getListingTypeLabel(initialListing?.type ?? 'Listing')} on Superteam Earn | ${
              initialListing?.sponsor?.name
            } is seeking freelancers and builders ${
              initialListing?.title
                ? `to work on ${initialListing.title}`
                : '| Apply Here'
            }`}
          />
          <link
            rel="canonical"
            href={`${getURL()}earn/listing/${initialListing?.slug}/`}
          />
          <meta
            property="og:title"
            content={`${initialListing?.title || 'Listing'} | Superteam Earn`}
          />
          <meta property="og:image" content={ogImage.toString()} />
          <meta
            name="twitter:title"
            content={`${initialListing?.title || 'Listing'} | Superteam Earn`}
          />
          <meta name="twitter:image" content={ogImage.toString()} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta
            property="og:image:alt"
            content={`${initialListing?.title || 'Listing'} - ${initialListing?.type === 'bounty' ? 'Bounty' : 'Project'} by ${initialListing?.sponsor?.name || 'Sponsor'} on Superteam Earn`}
          />
          <meta property="og:type" content="website" />
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
        {initialListing === null && <ErrorSection />}
        {initialListing !== null && !initialListing?.id && (
          <ErrorSection message="Sorry! The bounty you are looking for is not available." />
        )}
        {initialListing !== null && !!initialListing?.id && (
          <div className="mx-auto w-full px-2 lg:px-6">
            <div className="mx-auto w-full max-w-7xl">
              <ListingHeader
                isTemplate={isTemplate}
                commentCount={commentCount}
                listing={initialListing}
                submissionNumber={submissionNumber}
                isSubmissionNumberLoading={isSubmissionNumberLoading}
              />
              <div
                className={cn(
                  'flex min-h-screen flex-col items-center justify-center gap-0 bg-white md:flex-row md:items-start md:justify-between md:gap-4',
                  maxW,
                )}
              >
                {!isSubmissionPage && (
                  <div className="top-14 h-full w-full grow border-slate-100 md:sticky md:w-[23rem] md:border-r md:pr-2 lg:pr-5">
                    <RightSideBar
                      isTemplate={isTemplate}
                      listing={initialListing}
                      skills={iterableSkills}
                      submissionNumber={submissionNumber}
                      isSubmissionNumberLoading={isSubmissionNumberLoading}
                    />
                  </div>
                )}
                <div className="flex h-full w-full grow flex-col gap-8 pb-10">
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
                  {initialListing.pocSocials && (
                    <div className="flex w-full flex-col items-start md:hidden">
                      <p className="h-full text-center text-xs font-semibold text-slate-600">
                        CONTACT
                      </p>
                      <p>
                        <Link
                          className="ph-no-capture text-xs font-medium text-[#64768b]"
                          href={getURLSanitized(initialListing.pocSocials)}
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
                  {!!initialListing.commitmentDate && (
                    <div className="flex w-full flex-col items-start md:hidden">
                      <p className="h-full text-center text-xs font-semibold text-slate-600">
                        WINNER ANNOUNCEMENT BY
                      </p>
                      <div>
                        <span className="text-xs text-slate-500">
                          {dayjs(initialListing.commitmentDate).format(
                            'MMMM DD, YYYY',
                          )}{' '}
                          - as scheduled by the sponsor.
                        </span>
                      </div>
                    </div>
                  )}

                  <Comments
                    isTemplate={isTemplate}
                    isAnnounced={initialListing?.isWinnersAnnounced ?? false}
                    listingSlug={initialListing?.slug ?? ''}
                    listingType={initialListing?.type ?? ''}
                    poc={initialListing?.poc as User}
                    sponsorId={initialListing?.sponsorId}
                    isVerified={initialListing?.sponsor?.isVerified}
                    refId={initialListing?.id ?? ''}
                    refType="BOUNTY"
                    count={commentCount}
                    setCount={setCommentCount}
                    isDisabled={
                      !initialListing.isPublished &&
                      initialListing.status === 'OPEN'
                    }
                    isListingAndUserPro={
                      (initialListing?.isPro ?? false) && (user?.isPro ?? false)
                    }
                  />
                </div>
              </div>
            </div>
            <div className="sticky bottom-14 z-40 mb-12 w-full border-t border-slate-100 bg-white py-1 md:hidden">
              <SubmissionActionButton
                listing={initialListing}
                isTemplate={isTemplate}
              />
            </div>
          </div>
        )}
      </div>
    </Default>
  );
}
