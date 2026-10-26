'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { posthog } from 'posthog-js';

import { EmptySection } from '@/components/shared/EmptySection';
import type { ChapterRegionData } from '@/interface/chapter';
import { cn } from '@/utils/cn';
import { getURLSanitized } from '@/utils/getURLSanitized';

import { ApplicationActionButton } from '@/features/grants/components/ApplicationActionButton';
import { ApplicationStats } from '@/features/grants/components/ApplicationStats';
import { ApprovalStages } from '@/features/grants/components/ApprovalStages';
import { GrantsCardMini } from '@/features/grants/components/GrantsCardMini';
import { GrantsHeader } from '@/features/grants/components/GrantsHeader';
import { GrantStats } from '@/features/grants/components/GrantStats';
import { applicationStateOf } from '@/features/grants/hooks/useApplicationState';
import type { GrantApplicationWithTranchesAndUser } from '@/features/grants/queries/user-application';
import type { GrantWithApplicationCount } from '@/features/grants/types';
import { COINDCX_GRANT_ID } from '@/features/grants/utils/stGrant';
import type { GrantCardData } from '@/features/home/types/cards';
import { ExtraInfoSection } from '@/features/listings/components/ListingPage/ExtraInfoSection';
import { ChaptersProvider } from '@/features/listings/hooks/useChapters';

import { Default } from './Default';

// What the grant pages load on the server (src/app/earn/grants/[slug]).
export interface GrantPageData {
  // Their application to the grant; null when signed out or none.
  readonly application: GrantApplicationWithTranchesAndUser | null;
  readonly chapters: ChapterRegionData[];
  readonly liveGrants: ReadonlyArray<GrantCardData>;
}

interface GrantPageProps {
  grant: GrantWithApplicationCount | null;
  data: GrantPageData;
  children: React.ReactNode;
}

// Earn's snackbar over the header of an unpublished grant's page.
function GrantSnackbar({ isPublished }: { isPublished: boolean }) {
  if (isPublished) return null;
  return (
    <div
      className={cn(
        'flex w-full items-center justify-center gap-1 text-white',
        'bg-[#DC4830]',
      )}
    >
      <p className="p-3 text-center text-xs font-medium md:text-sm">
        This Grant Is Inactive Right Now. Check Out Other Grants on Our
        Homepage!
      </p>
    </div>
  );
}

export function GrantPageLayout({
  grant: initialGrant,
  data,
  children,
}: GrantPageProps) {
  const { application, chapters, liveGrants } = data;

  const iterableSkills = initialGrant?.skills?.map((e) => e.skills) ?? [];

  let isApproved = false;
  if (application && application.applicationStatus === 'Approved') {
    isApproved = true;
  }

  const showApplicationStats =
    initialGrant?.isNative &&
    initialGrant?.airtableId &&
    initialGrant?.id !== COINDCX_GRANT_ID;

  const grant = initialGrant?.id ? initialGrant : null;
  const isLoadError = initialGrant === null;

  return (
    <ChaptersProvider chapters={chapters}>
      <Default
        topBanner={
          initialGrant ? (
            <GrantSnackbar isPublished={!!initialGrant.isPublished} />
          ) : undefined
        }
      >
        <div className="bg-white">
          {!grant && (
            <EmptySection
              title={isLoadError ? 'Unable to load grant' : undefined}
              message={
                isLoadError
                  ? 'Please refresh the page and try again in a moment.'
                  : undefined
              }
            />
          )}
          {grant && (
            <div className="mx-auto w-full px-2 lg:px-6">
              <div className="mx-auto w-full max-w-7xl">
                <GrantsHeader
                  grant={grant}
                  title={grant.title}
                  sponsor={grant.sponsor}
                  status={grant.status}
                  region={grant.region}
                  slug={grant.slug}
                  references={grant.references}
                  isPublished={grant.isPublished || false}
                  isApproved={isApproved}
                  isST={grant.isST}
                />

                <div className="mb-10 flex max-w-6xl flex-col items-center justify-center gap-0 md:flex-row md:items-start md:justify-between md:gap-4">
                  <div className="static top-14 w-full md:sticky md:w-auto">
                    <div className="flex flex-col gap-2">
                      <div className="flex w-full flex-col justify-center rounded-xl bg-white py-4 md:w-88">
                        {isApproved && application && showApplicationStats ? (
                          <ApplicationStats
                            application={application}
                            grant={grant}
                          />
                        ) : (
                          <GrantStats grant={grant} />
                        )}
                        <div className="hidden w-full md:flex">
                          <ApplicationActionButton
                            grant={grant}
                            application={application}
                          />
                        </div>
                        {isApproved && application && showApplicationStats ? (
                          <ApprovalStages
                            application={application}
                            grant={grant}
                            applicationState={applicationStateOf(
                              application,
                              grant,
                            )}
                          />
                        ) : (
                          <>
                            <div>
                              <ExtraInfoSection
                                skills={iterableSkills}
                                region={grant.region}
                                requirements={grant.requirements}
                                pocSocials={grant.pocSocials}
                                isGrant
                              />
                            </div>
                            <div className="hidden w-full pt-8 md:block">
                              <div>
                                <p className="h-full text-start text-sm font-semibold text-slate-600">
                                  LIVE GRANTS
                                </p>
                                <div className="mt-1 flex w-full flex-col">
                                  {liveGrants.map((live) => (
                                    <GrantsCardMini
                                      grant={live}
                                      key={live.slug}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-8 border-slate-100 px-2 md:border-l md:px-5">
                    {children}
                    <div className="flex flex-col items-start md:hidden">
                      <p className="mb-1.5 h-full text-center text-xs font-semibold text-slate-600">
                        SKILLS NEEDED
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {iterableSkills?.map((skill) => (
                          <div
                            className="m-0 rounded-sm bg-slate-100 px-4 py-1 text-sm font-medium"
                            key={skill}
                          >
                            <p className="text-xs text-slate-600">{skill}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {grant.pocSocials && (
                      <div className="flex w-full flex-col items-start text-sm md:hidden">
                        <p className="h-full text-center font-semibold text-slate-600">
                          CONTACT
                        </p>
                        <p>
                          <Link
                            className="ph-no-capture font-medium text-[#64768b]"
                            href={getURLSanitized(grant.pocSocials)}
                            onClick={() => posthog.capture('reach out_listing')}
                          >
                            Reach out
                            <ExternalLink className="mx-1 mb-1 inline text-[#64768b]" />
                          </Link>
                          <span className="text-slate-500">
                            if you have any questions about this listing
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="sticky bottom-14 z-40 mb-10 w-full border-t border-slate-100 bg-white py-1 md:hidden">
                <ApplicationActionButton
                  grant={grant}
                  application={application}
                />
              </div>
            </div>
          )}
        </div>
      </Default>
    </ChaptersProvider>
  );
}
