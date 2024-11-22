import NextLink from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { MdArrowForward } from 'react-icons/md';

import { OgImageViewer } from '@/components/shared/ogImageViewer';
import { type FeedPostType, useGetFeed } from '@/features/feed';
import { timeAgoShort } from '@/utils/timeAgo';

interface ActivityCardProps {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  createdAt: string;
  link: string;
  listingType: 'bounty' | 'hackathon' | 'project';
  isWinner: boolean;
  isWinnersAnnounced: boolean;
  type: FeedPostType;
  ogImage: string;
}

const ActivityCard = ({
  id,
  firstName,
  lastName,
  username,
  createdAt,
  link,
  listingType,
  isWinner,
  isWinnersAnnounced,
  type,
  ogImage,
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

  return (
    <NextLink
      href={!!id ? `/feed/?type=${type}&id=${id}` : '/feed/?filter=new'}
      className="flex"
    >
      <OgImageViewer
        className="h-12 w-20 object-cover"
        externalUrl={link}
        imageUrl={ogImage}
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
    </NextLink>
  );
};

export const RecentActivity = () => {
  const posthog = usePostHog();
  const { data } = useGetFeed({ take: 5 });
  const activity = data?.pages[0] ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-400">
          RECENT ACTIVITY
        </span>
        <NextLink
          href="/feed"
          className="ph-no-capture flex items-center text-xs font-semibold text-brand-purple"
          onClick={() => {
            posthog.capture('recent winners_view all_homepage');
          }}
        >
          View All
          <MdArrowForward className="ml-1" />
        </NextLink>
      </div>
      <div className="mt-4 flex w-full flex-col gap-4">
        {activity.map((act, i) => (
          <ActivityCard
            key={i}
            id={act.id}
            link={act.link}
            firstName={act.firstName}
            lastName={act.lastName}
            username={act.username}
            createdAt={act.createdAt}
            listingType={act.listingType}
            isWinner={act.isWinner}
            isWinnersAnnounced={act.isWinnersAnnounced}
            type={act.type}
            ogImage={act.ogImage}
          />
        ))}
      </div>
    </div>
  );
};
