import { ArrowRight, Info } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { LocalImage } from '@/components/ui/local-image';
import { Tooltip } from '@/components/ui/tooltip';
import { type User } from '@/interface/user';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';

import { type Listing } from '../types';
import { ListingCard, ListingCardSkeleton } from './ListingCard';

interface TabProps {
  id: string;
  title: string;
  content: JSX.Element;
  posthog: string;
}

interface ListingTabsProps {
  isListingsLoading: boolean;
  bounties: Listing[] | undefined;
  forYou?: Listing[] | undefined;
  take?: number;
  showEmoji?: boolean;
  title: string;
  viewAllLink?: string;
  showViewAll?: boolean;
  showNotifSub?: boolean;
}

interface ContentProps {
  title: string;
  bounties?: Listing[];
  forYou?: Listing[];
  take?: number;
  isListingsLoading: boolean;
  filterFunction: (bounty: Listing) => boolean;
  sortCompareFunction?: ((a: Listing, b: Listing) => number) | undefined;
  emptyTitle: string;
  emptyMessage: string;
  user: User | null;
  showNotifSub?: boolean;
}

const EmptySection = dynamic(
  () =>
    import('@/components/shared/EmptySection').then((mod) => mod.EmptySection),
  { ssr: false },
);

const ListingTabTrigger = ({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'group relative inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all',
      'hover:text-brand-purple',
      isActive && [
        'text-brand-purple',
        'after:absolute after:bottom-[-6px] after:left-0 after:h-[2px] after:w-full after:bg-brand-purple/80',
      ],
      !isActive && 'text-slate-500',
    )}
  >
    {children}
  </button>
);

const generateTabContent = ({
  title,
  bounties,
  forYou,
  take,
  isListingsLoading,
  filterFunction,
  sortCompareFunction,
  emptyTitle,
  emptyMessage,
  user,
  showNotifSub,
}: ContentProps) => {
  if (isListingsLoading) {
    return (
      <div className="ph-no-capture flex flex-col gap-1">
        {Array.from({ length: 8 }, (_, index) => (
          <ListingCardSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  const filteredForYou = forYou?.filter(filterFunction) ?? [];
  const filteredBounties = bounties?.filter(filterFunction) ?? [];
  const showForYouSection = user && forYou && filteredForYou.length > 0;

  return (
    <div>
      {showForYouSection && (
        <div className="mb-4 border-b border-slate-200 pb-4">
          <div className="mb-2 flex w-fit items-center gap-3 font-semibold text-gray-900">
            <p className="flex-1">For You</p>
            <div className="text-gray-500">
              <Tooltip
                content="List of top opportunities curated for you, based on your skills, listing subscriptions and location."
                contentProps={{ className: 'max-w-80' }}
              >
                <Info className="h-3 w-3" />
              </Tooltip>
            </div>
          </div>
          <div className="ph-no-capture flex flex-col gap-1">
            {filteredForYou
              .sort(sortCompareFunction ? sortCompareFunction : () => 0)
              .slice(0, take ? take + 1 : undefined)
              .map((bounty) => (
                <ListingCard key={bounty.id} bounty={bounty} />
              ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 font-semibold text-gray-900">All {title}</p>
        <div className="ph-no-capture flex flex-col gap-1">
          {filteredBounties.length > 0 ? (
            filteredBounties
              .sort(sortCompareFunction ? sortCompareFunction : () => 0)
              .slice(0, take ? take + 1 : undefined)
              .map((bounty) => <ListingCard key={bounty.id} bounty={bounty} />)
          ) : (
            <div className="mt-8 flex items-center justify-center">
              <EmptySection
                showNotifSub={showNotifSub}
                title={emptyTitle}
                message={emptyMessage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ListingTabs = ({
  isListingsLoading,
  bounties,
  forYou,
  take,
  showEmoji = false,
  title,
  viewAllLink,
  showViewAll = false,
  showNotifSub = true,
}: ListingTabsProps) => {
  const { user } = useUser();
  const posthog = usePostHog();
  const emoji = '/assets/listing-tab.webp';
  const [activeTab, setActiveTab] = useState('open');

  const tabs: TabProps[] = [
    {
      id: 'open',
      title: 'Open',
      posthog: 'open_listings',
      content: generateTabContent({
        user,
        title: 'Open',
        bounties,
        forYou,
        take,
        isListingsLoading,
        filterFunction: (bounty) =>
          bounty.status === 'OPEN' &&
          !dayjs().isAfter(bounty.deadline) &&
          !bounty.isWinnersAnnounced,
        emptyTitle: 'No listings available!',
        emptyMessage:
          'Update your email preferences (from the user menu) to be notified about new work opportunities.',
        showNotifSub,
      }),
    },
    {
      id: 'in-review',
      title: 'In Review',
      posthog: 'in review_listing',
      content: generateTabContent({
        user,
        title: 'In Review',
        bounties,
        forYou,
        take,
        isListingsLoading,
        filterFunction: (bounty) =>
          !bounty.isWinnersAnnounced &&
          dayjs().isAfter(bounty.deadline) &&
          bounty.status === 'OPEN',
        emptyTitle: 'No listings in review!',
        emptyMessage:
          'Subscribe to notifications to get notified about updates.',
        showNotifSub,
      }),
    },
    {
      id: 'completed',
      title: 'Completed',
      posthog: 'completed_listing',
      content: generateTabContent({
        user,
        title: 'Completed',
        bounties,
        forYou,
        take,
        isListingsLoading,
        filterFunction: (bounty) => bounty.isWinnersAnnounced || false,
        sortCompareFunction: (a, b) => {
          const dateA = a.winnersAnnouncedAt
            ? new Date(a.winnersAnnouncedAt)
            : a.deadline
              ? new Date(a.deadline)
              : null;
          const dateB = b.winnersAnnouncedAt
            ? new Date(b.winnersAnnouncedAt)
            : b.deadline
              ? new Date(b.deadline)
              : null;

          if (dateA === null && dateB === null) {
            return 0;
          }
          if (dateB === null) {
            return 1;
          }
          if (dateA === null) {
            return -1;
          }

          return dateB.getTime() - dateA.getTime();
        },
        emptyTitle: 'No completed listings!',
        emptyMessage:
          'Subscribe to notifications to get notified about announcements.',
        showNotifSub,
      }),
    },
  ];

  useEffect(() => {
    posthog.capture('open_listings');
  }, []);

  return (
    <div className="mb-10 mt-5">
      <div className="mb-5 flex items-center justify-between sm:mb-4">
        <div className="flex w-full items-center justify-between sm:justify-start">
          <div className="flex items-center">
            {showEmoji && (
              <LocalImage
                className="xs:flex xs:hidden mr-2 h-5 w-5"
                alt="emoji"
                src={emoji}
              />
            )}
            <p className="whitespace-nowrap pr-2 text-[14px] font-semibold text-slate-700 sm:text-[15px] md:text-[16px]">
              {title}
            </p>
          </div>

          <div className="flex items-center">
            <span className="mx-0 mr-3 text-[0.625rem] text-slate-300 sm:mx-3">
              |
            </span>
            <div className="flex">
              {tabs.map((tab) => (
                <ListingTabTrigger
                  key={tab.id}
                  isActive={activeTab === tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    posthog.capture(tab.posthog);
                  }}
                >
                  <span className="text-[13px] font-medium md:text-[14px]">
                    {tab.title}
                  </span>
                </ListingTabTrigger>
              ))}
            </div>
          </div>
        </div>
        {showViewAll && (
          <div className="ph-no-capture hidden sm:flex">
            <Link href={viewAllLink!}>
              <Button
                className="px-2 py-1 text-xs text-slate-400 md:text-sm"
                onClick={() => posthog.capture('viewall top_listings')}
                size="sm"
                variant="ghost"
              >
                View All
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="-mt-4 mb-4 h-0.5 w-full bg-slate-200 sm:-mt-3.5" />

      {tabs.find((tab) => tab.id === activeTab)?.content}

      {showViewAll && (
        <Link className="ph-no-capture" href={viewAllLink!}>
          <Button
            className="my-8 w-full border-slate-300 py-5 text-slate-400"
            onClick={() => posthog.capture('viewall bottom_listings')}
            size="sm"
            variant="outline"
          >
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      )}
    </div>
  );
};
