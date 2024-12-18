import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { MdArrowForward } from 'react-icons/md';

import { LocalImage } from '@/components/ui/local-image';
import { timeAgoShort } from '@/utils/timeAgo';

import { homeFeedQuery } from '@/features/feed/queries/home-feed';
import { type FeedPostType } from '@/features/feed/types';

interface ActivityCardProps {
  firstName: string;
  lastName: string;
  username: string;
  createdAt: string;
  listingType: 'bounty' | 'hackathon' | 'project';
  isWinner: boolean;
  isWinnersAnnounced: boolean;
  type: FeedPostType;
}

const getRandomFallbackImage = (): string => {
  const basePath = '/assets/fallback/resized-og';
  const fallbackImages = Array.from(
    { length: 11 },
    (_, i) => `${basePath}/${i + 1}.webp`,
  );

  const randomIndex = Math.floor(Math.random() * fallbackImages.length);
  return fallbackImages[randomIndex]!;
};

const ActivityCard = ({
  firstName,
  lastName,
  username,
  createdAt,
  listingType,
  isWinner,
  isWinnersAnnounced,
  type,
}: ActivityCardProps) => {
  const getActionText = () => {
    const defaultActionText = {
      bounty: 'just submitted a bounty',
      hackathon: 'just submitted to a hackathon',
      project: 'just applied to a project',
    };

    const winnerActionText = {
      bounty: 'just won a bounty',
      hackathon: 'just won a hackathon track',
      project: 'just got selected for a project',
    };

    if (type === 'pow') {
      return 'just added a personal project';
    } else if (type === 'grant-application') {
      return 'just won a grant';
    } else if (isWinner && isWinnersAnnounced) {
      return winnerActionText[listingType] || 'just achieved something great';
    } else {
      return defaultActionText[listingType] || 'just took an action';
    }
  };

  const actionText = getActionText();
  const ogImage = getRandomFallbackImage();

  return (
    <Link href={'/feed/?filter=new'} className="flex">
      <LocalImage
        className="h-12 w-20 bg-center object-cover"
        alt="OG Image"
        src={ogImage}
      />
      <div className="ml-3">
        <div className="flex items-center">
          <span className="mr-1.5 max-w-32 overflow-hidden text-ellipsis whitespace-nowrap text-[0.9rem] font-semibold text-slate-800">
            {firstName} {lastName}
          </span>
          <span className="max-w-[5.7rem] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-slate-400">
            @{username}
          </span>
          <span className="mx-1 text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-400">
            {timeAgoShort(createdAt)}
          </span>
        </div>
        <p className="text-sm font-medium text-slate-600">{actionText}</p>
      </div>
    </Link>
  );
};

export const RecentActivity = () => {
  const posthog = usePostHog();
  const { data, isLoading } = useQuery(homeFeedQuery);

  if (isLoading) return null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-400">
          RECENT ACTIVITY
        </span>
        <Link
          href="/feed"
          className="ph-no-capture flex items-center text-xs font-semibold text-brand-purple"
          onClick={() => {
            posthog.capture('recent winners_view all_homepage');
          }}
        >
          View All
          <MdArrowForward className="ml-1" />
        </Link>
      </div>
      <div className="mt-4 flex w-full flex-col gap-4">
        {data?.map((act, i) => (
          <ActivityCard
            key={i}
            firstName={act.user.firstName}
            lastName={act.user.lastName}
            username={act.user.username}
            createdAt={act.createdAt}
            listingType={act.listing.type as 'bounty' | 'hackathon' | 'project'}
            isWinner={act.isWinner}
            isWinnersAnnounced={act.listing.isWinnersAnnounced}
            type={'submission'}
          />
        ))}
      </div>
    </div>
  );
};
