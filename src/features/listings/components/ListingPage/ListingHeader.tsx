'use client';

import { Check, Clock, File, MessageSquare, Pause } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { posthog } from 'posthog-js';
import React from 'react';

import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { Tooltip } from '@/components/ui/tooltip';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useServerTimeSync } from '@/hooks/use-server-time';
import type { SponsorType } from '@/interface/sponsor';
import { useViewer } from '@/lib/viewer';
import { PulseIcon } from '@/svg/pulse-icon';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';

import { getHackathonPageHref } from '@/features/hackathon/utils/getHackathonPageHref';

import type { Listing, ListingHackathon } from '../../types';
import { getListingIcon } from '../../utils/getListingIcon';
import { BookmarkListing } from './BookmarkListing';
import { ListingTabLink } from './ListingTabLink';
import { RegionLabel } from './RegionLabel';
import { SecondaryOptions } from './SecondaryOptions';
import { ListingHeaderSeparator } from './Separator';
import { StatusBadge } from './StatusBadge';

const SponsorLogo = ({ sponsor }: { sponsor: SponsorType | undefined }) => {
  return (
    <Link href={`/earn/s/${sponsor?.slug}`}>
      <img
        className="mr-2 h-12 w-12 rounded-md object-cover md:h-16 md:w-16"
        alt={sponsor?.name}
        src={sponsor?.logo || `${ASSET_URL}/logo/sponsor-logo.png`}
      />
    </Link>
  );
};

const ListingTitle = ({ title }: { title: string | undefined }) => {
  return (
    <h1 className="text-lg font-semibold tracking-tight text-slate-700 sm:text-xl">
      {title}
    </h1>
  );
};

const ListingStatus = ({
  statusIcon,
  statusText,
  statusTextColor,
}: {
  statusIcon: React.JSX.Element;
  statusText: string;
  statusTextColor: string;
}) => {
  return (
    <StatusBadge
      Icon={statusIcon}
      textColor={statusTextColor}
      text={statusText}
    />
  );
};

const HeaderSub = ({
  sponsor,
  title,
  isHackathon,
  Hackathon,
  type,
  isPrivate,
  commentCount,
  statusIcon,
  statusText,
  statusTextColor,
  region,
}: {
  sponsor: SponsorType | undefined;
  title: string | undefined;
  isHackathon: boolean;
  Hackathon: ListingHackathon | undefined;
  type: string | undefined;
  isPrivate: boolean | undefined;
  commentCount: number | undefined;
  statusIcon: React.JSX.Element;
  statusText: string;
  statusTextColor: string;
  region: string | undefined;
}) => {
  const isFrontierHackathon = Hackathon?.slug === 'crypto-worlds-fair';
  const hackathonLogo =
    Hackathon?.slug === 'next-stop-breakpoint'
      ? Hackathon.altLogo || Hackathon.logo
      : Hackathon?.logo || Hackathon?.altLogo || '';

  return (
    <div className="flex flex-wrap items-center gap-1 md:gap-2">
      <Link
        href={`/earn/s/${sponsor?.slug}`}
        className="group flex items-center gap-1"
        onClick={() => {
          posthog.capture('sponsor_listing', {
            sponsor_slug: sponsor?.slug,
            sponsor_name: sponsor?.name,
            listing_title: title,
          });
        }}
      >
        <p className="max-w-[200px] overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap text-slate-500">
          by <span className="group-hover:underline">{sponsor?.name}</span>
        </p>
        {!!sponsor?.isVerified && <VerifiedBadge />}
      </Link>
      <ListingHeaderSeparator />
      {isHackathon && Hackathon ? (
        <div className="flex items-center">
          <Link href={getHackathonPageHref(Hackathon.slug)}>
            <img
              className={cn(
                'w-auto object-contain',
                isFrontierHackathon ? 'h-2.5' : 'h-4',
              )}
              alt={Hackathon.name}
              src={hackathonLogo}
            />
          </Link>
        </div>
      ) : (
        <div className="flex">
          <Tooltip
            content={
              'Bounties are open for anyone to participate in and submit their work (as long as they meet the eligibility requirements mentioned below). The best submissions win!'
            }
            contentProps={{ className: 'max-w-80' }}
          >
            <div className="flex items-center gap-1">
              {getListingIcon(type ?? '', 'fill-slate-400')}
              <p className="text-sm font-medium text-gray-400">
                {isPrivate ? 'Private' : 'Bounty'}
              </p>
            </div>
          </Tooltip>
        </div>
      )}
      <ListingHeaderSeparator className="hidden sm:flex" />
      <div className="hidden sm:flex">
        <ListingStatus
          statusIcon={statusIcon}
          statusText={statusText}
          statusTextColor={statusTextColor}
        />
      </div>
      <ListingHeaderSeparator />
      <RegionLabel region={region} />
      {!!commentCount && (
        <>
          <ListingHeaderSeparator className="hidden sm:flex" />

          <Link className="hidden md:block" href="#comments">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 fill-slate-600 text-slate-500" />
              <p className="text-sm text-slate-400">{commentCount}</p>
            </div>
          </Link>
        </>
      )}
    </div>
  );
};

export function ListingHeader({
  listing,
  isTemplate = false,
  commentCount,
  submissionNumber,
  isSubmissionNumberLoading = false,
  bookmarks = { count: 0, bookmarked: false },
}: {
  listing: Listing;
  isTemplate?: boolean;
  commentCount?: number;
  submissionNumber?: number;
  isSubmissionNumberLoading?: boolean;
  // Loaded with the page.
  bookmarks?: { count: number; bookmarked: boolean };
}) {
  const {
    type,
    status,
    deadline,
    title,
    sponsor,
    slug,
    region,
    isWinnersAnnounced,
    publishedAt,
    isPublished,
    Hackathon,
    isPrivate,
  } = listing;
  const pathname = usePathname() ?? '';

  const user = useViewer();

  const { serverTime } = useServerTimeSync();

  const isMD = useMediaQuery('(min-width: 768px)');
  const hasDeadlineEnded = dayjs(serverTime()).isAfter(deadline);
  const hasHackathonStarted = dayjs(serverTime()).isAfter(Hackathon?.startDate);
  const isHackathon = Boolean(Hackathon);

  const statusIconStyles = 'w-5 h-5';
  let statusText = '';
  let statusTextColor = '';
  let statusIcon: React.JSX.Element = <></>;

  if (!isPublished && !publishedAt) {
    statusIcon = <File className={cn(statusIconStyles, 'text-slate-400')} />;
    statusText = 'Draft';
    statusTextColor = 'text-slate-500';
  } else if (!isPublished && publishedAt) {
    statusIcon = <Pause className={cn(statusIconStyles, 'text-[#ffecb3]')} />;
    statusText = isMD ? 'Submissions Paused' : 'Paused';
    statusTextColor = 'text-[#F59E0B]';
  } else if (isHackathon && !hasDeadlineEnded && !hasHackathonStarted) {
    statusIcon = <Clock className={cn(statusIconStyles, 'text-purple-100')} />;
    statusText = 'Opens Soon';
    statusTextColor = 'text-[#8B5CF6]';
  } else if (status === 'OPEN' && isWinnersAnnounced) {
    statusIcon = <Check className={cn(statusIconStyles, 'text-slate-400')} />;
    statusText = 'Completed';
    statusTextColor = 'text-slate-400';
  } else if (!isWinnersAnnounced && hasDeadlineEnded && status === 'OPEN') {
    statusIcon = <PulseIcon w={5} h={5} bg="bg-orange-100" text="#f97316" />;
    statusText = 'In Review';
    statusTextColor = 'text-orange-500';
  } else if (!hasDeadlineEnded && !isWinnersAnnounced && status === 'OPEN') {
    statusIcon = (
      <PulseIcon isPulsing w={4} h={4} bg={'#9AE6B4'} text="#16A34A" />
    );
    statusText = isMD ? 'Submissions Open' : 'Open';
    statusTextColor = 'text-green-600';
  }

  const isSubmissionPage = pathname.replace(/\/$/, '').endsWith('/submission');

  return (
    <div className="flex flex-col gap-1 bg-white">
      <div className="mx-auto flex w-full max-w-7xl justify-between gap-5 py-4 md:py-10">
        <div className="flex items-center">
          <SponsorLogo sponsor={sponsor} />
          <div
            className={cn(
              'flex flex-col items-start',
              isHackathon ? 'gap-0' : 'gap-1',
            )}
          >
            <div className="flex gap-1">
              <div className="hidden md:flex">
                <p
                  aria-hidden="true"
                  className="text-lg font-semibold tracking-tight text-slate-700 sm:text-xl"
                >
                  {title}
                </p>
              </div>
            </div>
            <div className="hidden md:flex">
              <HeaderSub
                sponsor={sponsor}
                title={title}
                isHackathon={isHackathon}
                Hackathon={Hackathon}
                type={type}
                isPrivate={isPrivate}
                commentCount={commentCount}
                statusIcon={statusIcon}
                statusText={statusText}
                statusTextColor={statusTextColor}
                region={region}
              />
            </div>
          </div>
        </div>
        {listing.id && listing.isPublished && (
          <div className="flex items-center gap-2">
            {user?.currentSponsorId !== listing.sponsorId && (
              <BookmarkListing
                isTemplate={isTemplate}
                id={listing.id}
                initialCount={bookmarks.count}
                initialBookmarked={bookmarks.bookmarked}
              />
            )}
            <SecondaryOptions listing={listing} />
          </div>
        )}
      </div>
      <div className="mb-5 flex w-full flex-col gap-1 md:hidden">
        <ListingTitle title={title} />
        <HeaderSub
          sponsor={sponsor}
          title={title}
          isHackathon={isHackathon}
          Hackathon={Hackathon}
          type={type}
          isPrivate={isPrivate}
          commentCount={commentCount}
          statusIcon={statusIcon}
          statusText={statusText}
          statusTextColor={statusTextColor}
          region={region}
        />
      </div>
      <div className="flex h-10 w-full max-w-7xl items-center">
        <div className="mx-auto my-auto flex h-full w-full max-w-7xl items-center justify-start border-b border-slate-200">
          {!isSubmissionPage && (
            <ListingTabLink
              className="pointer-events-none hidden px-0 md:flex md:w-[23rem]"
              href={`/earn/listing/${slug}/`}
              text="Prizes"
            />
          )}

          <ListingTabLink
            href={
              !isTemplate
                ? `/earn/listing/${slug}/`
                : `/earn/templates/listings/${slug}/`
            }
            text="Details"
            className="mr-6"
          />

          {isWinnersAnnounced && (
            <ListingTabLink
              onClick={() => posthog.capture('submissions tab_listing')}
              href={`/earn/listing/${slug}/submission`}
              text="Submissions"
              subText={
                isSubmissionNumberLoading ? '...' : submissionNumber + ''
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
