'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { posthog } from 'posthog-js';
import { useEffect, useMemo, useState } from 'react';

import { ErrorSection } from '@/components/shared/ErrorSection';
import type { ChapterRegionData } from '@/interface/chapter';
import type { ListingWinner } from '@/interface/submission';
import type { ViewerEntry } from '@/server/listing-details';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';
import { getURLSanitized } from '@/utils/getURLSanitized';

import { Comments } from '@/features/comments/components/Comments';
import type { CommentsPage } from '@/features/comments/types';
import type { ListingCardData } from '@/features/home/types/cards';

import { ChaptersProvider } from '../../hooks/useChapters';
import type { PublicListing } from '../../types';
import { SubmissionActionButton } from '../Submission/SubmissionActionButton';
import { ListingHeader } from './ListingHeader';
import { RightSideBar } from './RightSideBar';

export interface ListingPageData {
  readonly submissionNumber: number;
  readonly winners: ListingWinner[];
  readonly comments: CommentsPage | undefined;
  readonly bookmarks: { count: number; bookmarked: boolean };
  readonly chapters: ChapterRegionData[];
  readonly submission: ViewerEntry | null;
  readonly creditBalance: number;
  readonly related: ListingCardData[];
  readonly now: number;
}

interface Props {
  listing: PublicListing | null;
  children: React.ReactNode;
  maxW?: '7xl' | '6xl' | '5xl' | '4xl' | '3xl' | '2xl' | 'xl' | 'lg' | 'md';
  isTemplate?: boolean;
  data: ListingPageData;
}

// Earn's listing page frame: header, tabs, sidebar, the page itself, the
// comments and (on phones) the submit bar, from data loaded on the server.
export function ListingPageFrame({
  listing: initialListing,
  children,
  maxW = '7xl',
  isTemplate = false,
  data,
}: Props) {
  const pathname = usePathname() ?? '';
  const submissionNumber = data.submissionNumber;
  const isSubmissionNumberLoading = false;
  const [commentCount, setCommentCount] = useState(data.comments?.count ?? 0);
  const iterableSkills = useMemo(
    () => initialListing?.skills?.map((e) => e.skills) ?? [],
    [initialListing?.skills],
  );

  useEffect(() => {
    if (initialListing?.type === 'bounty') {
      posthog.capture('open_bounty');
    }
    // Once per page view, as Earn did.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSubmissionPage = pathname.replace(/\/$/, '').endsWith('/submission');

  return (
    <ChaptersProvider chapters={data.chapters}>
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
                bookmarks={data.bookmarks}
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
                      winners={data.winners}
                      submission={data.submission}
                      creditBalance={data.creditBalance}
                      related={data.related}
                      now={data.now}
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
                    poc={initialListing?.poc}
                    sponsorId={initialListing?.sponsorId}
                    isVerified={initialListing?.sponsor?.isVerified}
                    refId={initialListing?.id ?? ''}
                    refType="BOUNTY"
                    count={commentCount}
                    setCount={setCommentCount}
                    initialData={data.comments}
                    isDisabled={
                      !initialListing.isPublished &&
                      initialListing.status === 'OPEN'
                    }
                  />
                </div>
              </div>
            </div>
            <div className="sticky bottom-14 z-40 mb-12 w-full border-t border-slate-100 bg-white py-1 md:hidden">
              <SubmissionActionButton
                listing={initialListing}
                isTemplate={isTemplate}
                submission={data.submission}
                creditBalance={data.creditBalance}
              />
            </div>
          </div>
        )}
      </div>
    </ChaptersProvider>
  );
}
