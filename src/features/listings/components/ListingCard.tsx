import Link from 'next/link';

import IoIosStar from '@/components/icons/IoIosStar';
import MdModeComment from '@/components/icons/MdModeComment';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { ASSET_URL } from '@/constants/ASSET_URL';
import { tokenList } from '@/constants/tokenList';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';
import { timeAgoShort } from '@/utils/timeAgo';

import { type Listing } from '../types';
import { getListingIcon } from '../utils/getListingIcon';
import { CompensationAmount } from './ListingPage/CompensationAmount';

export const ListingCardSkeleton = () => {
  return (
    <div className="rounded-md px-1 py-4 sm:px-4">
      <div className="flex w-full items-center justify-between">
        <div className="flex h-14 w-full sm:h-16">
          <Skeleton className="mr-3 h-14 w-[4.2rem] rounded-md sm:mr-5 sm:h-16 sm:w-[4.6rem]" />
          <div className="flex w-full flex-col justify-between">
            <Skeleton className="h-3.5 w-[60%]" />
            <Skeleton className="h-3 w-[130px]" />
            <div className="flex gap-2">
              <Skeleton className="h-3 w-[56px]" />
              <Skeleton className="h-3 w-[48px]" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-[14px] w-[54px]" />
        </div>
      </div>
    </div>
  );
};

export const ListingCard = ({ bounty }: { bounty: Listing }) => {
  const {
    rewardAmount,
    deadline,
    type,
    sponsor,
    title,
    token,
    slug,
    isWinnersAnnounced,
    isFeatured,
    compensationType,
    minRewardAsk,
    maxRewardAsk,
    winnersAnnouncedAt,
    _count,
  } = bounty;

  const isBeforeDeadline = dayjs().isBefore(dayjs(deadline));

  const targetDate =
    isWinnersAnnounced && winnersAnnouncedAt ? winnersAnnouncedAt : deadline;

  const formattedDeadline = timeAgoShort(targetDate!);

  let deadlineText;

  if (isBeforeDeadline) {
    deadlineText = `Due in ${formattedDeadline}`;
  } else {
    deadlineText = isWinnersAnnounced
      ? `Completed ${formattedDeadline} ago`
      : `Expired ${formattedDeadline} ago`;
  }

  const sponsorLogo = sponsor?.logo
    ? sponsor.logo.replace('/upload/', '/upload/c_scale,w_128,h_128,f_auto/')
    : `${ASSET_URL}/logo/sponsor-logo.png`;

  const tokenIcon = tokenList.find((ele) => ele.tokenSymbol === token)?.icon;

  const isVariable = compensationType === 'variable';
  const showToken = !isVariable || (isVariable && isWinnersAnnounced);

  return (
    <Link
      href={`/listing/${slug}`}
      className={cn(
        'block w-full rounded-md px-2 py-4 no-underline hover:bg-gray-100 sm:px-4',
        isFeatured && isBeforeDeadline ? 'bg-purple-50' : '',
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex w-full">
          <img
            className="mr-3 h-14 w-14 rounded-md sm:mr-5 sm:h-16 sm:w-16"
            alt={sponsor?.name}
            src={sponsorLogo}
          />

          <div className="flex w-full flex-col justify-between">
            <p className="line-clamp-1 text-sm font-semibold text-slate-700 sm:text-base">
              {title}
            </p>
            <div className="flex w-min items-center gap-1">
              <p className="w-full text-xs whitespace-nowrap text-slate-500 md:text-sm">
                {sponsor?.name}
              </p>
              <div>{!!sponsor?.isVerified && <VerifiedBadge />}</div>
            </div>
            <div className="mt-[1px] flex items-center gap-1 sm:gap-2">
              <div className="flex items-center justify-start sm:hidden">
                {!!showToken && (
                  <img
                    className="mr-0.5 h-3.5 w-3.5 rounded-full"
                    alt={token}
                    src={tokenIcon}
                  />
                )}
                <div className="flex items-baseline">
                  <CompensationAmount
                    compensationType={compensationType}
                    maxRewardAsk={maxRewardAsk}
                    minRewardAsk={minRewardAsk}
                    rewardAmount={rewardAmount}
                    isWinnersAnnounced={isWinnersAnnounced}
                    className="text-xs font-semibold whitespace-nowrap text-slate-600 sm:text-base"
                  />

                  {!!showToken && (
                    <p className="text-xs font-medium text-gray-400">{token}</p>
                  )}
                </div>
                <p className="ml-1 text-[10px] text-slate-300">|</p>
              </div>
              <div className="flex items-center gap-1">
                {getListingIcon(type!)}
                <p
                  className={cn(
                    'hidden text-xs font-medium text-gray-500 sm:flex',
                  )}
                >
                  {type && type.charAt(0).toUpperCase() + type.slice(1)}
                </p>
              </div>

              <p className="flex text-[10px] text-slate-300 sm:text-xs md:text-sm">
                |
              </p>
              <div className="flex items-center gap-1">
                <p className="text-[10px] whitespace-nowrap text-gray-500 sm:text-xs">
                  {deadlineText}
                </p>
              </div>
              <p className="hidden text-[10px] text-slate-300 sm:flex sm:text-xs md:text-sm">
                |
              </p>
              {!!_count?.Comments && _count?.Comments > 0 && (
                <div
                  className={cn(
                    'hidden items-center gap-0.5 sm:flex',
                    'text-xs text-gray-500',
                    'mx-1 sm:mx-0',
                  )}
                >
                  <MdModeComment className="w-[0.8rem] text-slate-500" />
                  <p>{_count?.Comments}</p>
                </div>
              )}
              {!!isFeatured && isBeforeDeadline && (
                <div
                  className={cn(
                    'flex items-center gap-1',
                    'text-xs text-violet-600',
                    'mx-1 sm:mx-0',
                  )}
                >
                  <IoIosStar />
                  <p className="hidden pt-0.5 font-semibold sm:flex">
                    FEATURED
                  </p>
                </div>
              )}

              {dayjs().isBefore(dayjs(deadline)) && !isWinnersAnnounced && (
                <div className="mx-1 h-2 w-2 rounded-full bg-[#16A35F] sm:mx-0" />
              )}
            </div>
          </div>
        </div>
        <div
          className={cn(
            'hidden items-center justify-start sm:flex',
            showToken ? 'mr-3' : 'mr-0',
          )}
        >
          {!!showToken && (
            <img
              className="mt-1 mr-1 h-4 w-4 rounded-full sm:mt-0.5"
              alt={token}
              src={tokenIcon}
            />
          )}
          <div className="flex items-baseline gap-1">
            <CompensationAmount
              compensationType={compensationType}
              maxRewardAsk={maxRewardAsk}
              minRewardAsk={minRewardAsk}
              rewardAmount={rewardAmount}
              isWinnersAnnounced={isWinnersAnnounced}
              className="text-xs font-semibold whitespace-nowrap text-slate-600 sm:text-base"
            />

            {!!showToken && (
              <p className="text-xs font-medium text-gray-400 sm:text-base">
                {token}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
