import { useQuery } from '@tanstack/react-query';
import { Check, Clock, File, MessageSquare, Pause } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import React from 'react';

import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { Tooltip } from '@/components/ui/tooltip';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useServerTimeSync } from '@/hooks/use-server-time';
import { useUser } from '@/store/user';
import { PulseIcon } from '@/svg/pulse-icon';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';

import { BoostButton } from '@/features/listing-builder/components/Form/Boost/BoostButton';

import { submissionCountQuery } from '../../queries/submission-count';
import { type Listing } from '../../types';
import { getListingIcon } from '../../utils/getListingIcon';
import { ListingTabLink } from './ListingTabLink';
import { RegionLabel } from './RegionLabel';
import { SecondaryOptions } from './SecondaryOptions';
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

  const { user } = useUser();

  const { serverTime } = useServerTimeSync();

  const isMD = useMediaQuery('(min-width: 768px)');
  const hasDeadlineEnded = dayjs(serverTime()).isAfter(deadline);
  const hasHackathonStarted = dayjs(serverTime()).isAfter(Hackathon?.startDate);
  const isProject = type === 'project';
  const isHackathon = type === 'hackathon';

  const { data: submissionNumber, isLoading: isSubmissionNumberLoading } =
    useQuery(submissionCountQuery(listing.id!));

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

  const ListingTitle = () => {
    return (
      <h1 className="text-lg font-semibold tracking-tight text-slate-700 sm:text-xl">
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
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 fill-slate-600 text-slate-500" />
            <p className="text-sm text-slate-400">{commentCount}</p>
          </div>
        </Link>
      )
    );
  };

  const HeaderSub = () => {
    return (
      <div className="flex flex-wrap items-center gap-1 md:gap-2">
        <Link
          href={`/s/${sponsor?.slug}`}
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
        {isHackathon ? (
          <div className="flex items-center">
            <Link href={`/hackathon/${Hackathon?.slug}`}>
              <img
                className="h-[1rem]"
                alt={type}
                src={Hackathon?.logo || Hackathon?.altLogo || ''}
              />
            </Link>
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
                {getListingIcon(type!, 'fill-slate-400')}
                <p className="text-sm font-medium text-gray-400">
                  {isPrivate ? 'Private' : isProject ? 'Project' : 'Bounty'}
                </p>
              </div>
            </Tooltip>
          </div>
        )}
        <ListingHeaderSeparator className="hidden sm:flex" />
        <div className="hidden sm:flex">
          <ListingStatus />
        </div>
        <ListingHeaderSeparator />
        <RegionLabel region={region} />
        {!!commentCount && (
          <>
            <ListingHeaderSeparator className="hidden sm:flex" />
            <CommentCount />
          </>
        )}
      </div>
    );
  };

  const SponsorLogo = () => {
    return (
      <Link href={`/s/${sponsor?.slug}`}>
        <img
          className="mr-2 h-12 w-12 rounded-md object-cover md:h-16 md:w-16"
          alt={sponsor?.name}
          src={sponsor?.logo || `${ASSET_URL}/logo/sponsor-logo.png`}
        />
      </Link>
    );
  };

  const isSubmissionPage = router.pathname.endsWith('/submission');

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
        {listing.id && listing.isPublished && (
          <div className="flex items-center gap-2">
            {user?.currentSponsorId === listing.sponsorId ? (
              <BoostButton listing={listing} />
            ) : (
              <SubscribeListing isTemplate={isTemplate} id={listing.id} />
            )}
            <SecondaryOptions listing={listing} />
          </div>
        )}
      </div>
      <div className="mb-5 flex w-full flex-col gap-1 md:hidden">
        <ListingTitle />
        <HeaderSub />
      </div>
      <div className="flex h-10 w-full max-w-7xl items-center">
        <div className="mx-auto my-auto flex h-full w-full max-w-7xl items-center justify-start border-b border-slate-200">
          {!isSubmissionPage && (
            <ListingTabLink
              className="pointer-events-none hidden px-0 md:flex md:w-[23rem]"
              href={`/listing/${slug}/`}
              text={
                type === 'project'
                  ? isWinnersAnnounced
                    ? 'Proposals Selected'
                    : 'Inviting Proposals'
                  : 'Prizes'
              }
              isActive={false}
            />
          )}

          <ListingTabLink
            href={
              !isTemplate ? `/listing/${slug}/` : `/templates/listings/${slug}/`
            }
            text="Details"
            isActive={!router.asPath.split('/')[3]?.includes('submission')}
            className="mr-6"
          />

          {!isProject && isWinnersAnnounced && (
            <ListingTabLink
              onClick={() => posthog.capture('submissions tab_listing')}
              href={`/listing/${slug}/submission`}
              text="Submissions"
              isActive={!!router.asPath.split('/')[3]?.includes('submission')}
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
