import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React from 'react';
import {
  LuCheck,
  LuClock,
  LuFile,
  LuMessageSquare,
  LuPause,
} from 'react-icons/lu';
import { MdLock } from 'react-icons/md';

import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { LocalImage } from '@/components/ui/local-image';
import { Tooltip } from '@/components/ui/tooltip';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { useMediaQuery } from '@/hooks/use-media-query';
import { PulseIcon } from '@/svg/pulse-icon';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';

import { submissionCountQuery } from '../../queries/submission-count';
import { type Listing } from '../../types';
import { getListingIcon } from '../../utils/getListingIcon';
import { ListingTabLink } from './ListingTabLink';
import { RegionLabel } from './RegionLabel';
import { ListingHeaderSeparator } from './Separator';
import { StatusBadge } from './StatusBadge';
import { SubscribeListing } from './SubscribeListing';

export function ListingHeader({
  listing,
  isTemplate = false,
  commentCount,
}: {
  listing: Listing;
  isTemplate?: boolean;
  commentCount?: number;
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
  const router = useRouter();
  const posthog = usePostHog();
  const isMD = useMediaQuery('(min-width: 768px)');
  const hasDeadlineEnded = dayjs().isAfter(deadline);
  const hasHackathonStarted = dayjs().isAfter(Hackathon?.startDate);
  const isProject = type === 'project';
  const isHackathon = type === 'hackathon';

  const { data: submissionNumber, isLoading: isSubmissionNumberLoading } =
    useQuery(submissionCountQuery(listing.id!));

  const statusIconStyles = 'w-5 h-5';
  let statusText = '';
  let statusTextColor = '';
  let statusIcon: React.JSX.Element = <></>;

  if (!isPublished && !publishedAt) {
    statusIcon = <LuFile className={cn(statusIconStyles, 'text-slate-400')} />;
    statusText = 'Draft';
    statusTextColor = 'text-slate-500';
  } else if (!isPublished && publishedAt) {
    statusIcon = <LuPause className={cn(statusIconStyles, 'text-[#ffecb3]')} />;
    statusText = isMD ? 'Submissions Paused' : 'Paused';
    statusTextColor = 'text-[#F59E0B]';
  } else if (isHackathon && !hasDeadlineEnded && !hasHackathonStarted) {
    statusIcon = (
      <LuClock className={cn(statusIconStyles, 'text-purple-100')} />
    );
    statusText = 'Opens Soon';
    statusTextColor = 'text-[#8B5CF6]';
  } else if (status === 'OPEN' && isWinnersAnnounced) {
    statusIcon = <LuCheck className={cn(statusIconStyles, 'text-slate-400')} />;
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

  const ListingTitle = () => {
    return (
      <h1 className="text-xl font-bold tracking-[-0.5px] text-slate-700">
        {title}
      </h1>
    );
  };

  const ListingStatus = () => {
    return (
      <StatusBadge
        Icon={statusIcon}
        textColor={statusTextColor}
        text={statusText}
      />
    );
  };

  const CommentCount = () => {
    return (
      !!commentCount && (
        <Link className="hidden md:block" href="#comments">
          <div className="ml-4 flex items-center gap-2">
            <LuMessageSquare className="h-4 w-4 fill-slate-600 text-slate-500" />
            <p className="text-sm text-slate-400">{commentCount}</p>
          </div>
        </Link>
      )
    );
  };

  const PrivateLabel = () => {
    if (!isPrivate) return null;
    return (
      <>
        <ListingHeaderSeparator />
        <div className="flex items-center gap-1">
          <MdLock className="h-4 w-4 text-slate-500" />
          <p className="text-sm text-slate-400">Private</p>
        </div>
      </>
    );
  };

  const HeaderSub = () => {
    return (
      <div className="flex flex-wrap items-center gap-1 md:gap-3">
        <div className="flex items-center gap-1">
          <p className="whitespace-nowrap text-sm font-medium text-slate-400">
            by {sponsor?.name}
          </p>
          {!!sponsor?.isVerified && <VerifiedBadge />}
        </div>
        <ListingHeaderSeparator />
        {isHackathon ? (
          <div className="flex items-center">
            <ExternalImage
              className="h-[1rem]"
              alt={type}
              src={Hackathon?.altLogo!}
            />
          </div>
        ) : (
          <div className="flex">
            <Tooltip
              content={
                isProject
                  ? 'A Project is a short-term gig where sponsors solicit applications from multiple people, and select the best one to work on the Project.'
                  : 'Bounties are open for anyone to participate in and submit their work (as long as they meet the eligibility requirements mentioned below). The best submissions win!'
              }
              contentProps={{ className: 'max-w-80' }}
            >
              <div className="flex items-center gap-1">
                <LocalImage
                  alt={type!}
                  className="-ml-0.5"
                  src={getListingIcon(type!)}
                />
                <p className="text-xs font-medium text-gray-400 md:text-sm">
                  {isProject ? 'Project' : 'Bounty'}
                </p>
              </div>
            </Tooltip>
          </div>
        )}
        <ListingHeaderSeparator />
        <div className="flex">
          <ListingStatus />
        </div>
        <PrivateLabel />
        <ListingHeaderSeparator />
        <RegionLabel region={region} />
        <CommentCount />
      </div>
    );
  };

  const SponsorLogo = () => {
    return (
      <img
        className="mr-2 h-12 w-12 rounded-md object-cover md:h-16 md:w-16"
        alt={sponsor?.name}
        src={sponsor?.logo || `${ASSET_URL}/logo/sponsor-logo.png`}
      />
    );
  };

  return (
    <div className="flex flex-col gap-1 bg-white">
      <div className="mx-auto flex w-full max-w-7xl justify-between gap-5 py-4 md:py-10">
        <div className="flex items-center">
          <SponsorLogo />
          <div
            className={cn(
              'flex flex-col items-start',
              isHackathon ? 'gap-0' : 'gap-1',
            )}
          >
            <div className="flex gap-1">
              <div className="hidden md:flex">
                <ListingTitle />
              </div>
            </div>
            <div className="hidden md:flex">
              <HeaderSub />
            </div>
          </div>
        </div>
        {listing.id && (
          <SubscribeListing isTemplate={isTemplate} id={listing.id} />
        )}
      </div>
      <div className="mb-5 flex w-full flex-col gap-1 md:hidden">
        <ListingTitle />
        <HeaderSub />
      </div>
      {
        <div className="flex h-10 w-full max-w-7xl items-center">
          <div className="mx-auto my-auto flex h-full w-full max-w-7xl items-center justify-start gap-10 border-b border-slate-200">
            <ListingTabLink
              className="pointer-events-none hidden md:flex md:w-[22rem]"
              href={`/listings/${type}/${slug}/`}
              text={type === 'project' ? 'Inviting Proposals' : 'Prizes'}
              isActive={false}
            />
            <ListingTabLink
              href={
                !isTemplate
                  ? `/listings/${type}/${slug}/`
                  : `/templates/listings/${slug}/`
              }
              text="Details"
              isActive={!router.asPath.split('/')[4]?.includes('submission')}
            />

            {!isProject && isWinnersAnnounced && (
              <ListingTabLink
                onClick={() => posthog.capture('submissions tab_listing')}
                href={`/listings/${type}/${slug}/submission`}
                text="Submissions"
                isActive={!!router.asPath.split('/')[4]?.includes('submission')}
                subText={
                  isSubmissionNumberLoading ? '...' : submissionNumber + ''
                }
              />
            )}
          </div>
        </div>
      }
    </div>
  );
}
