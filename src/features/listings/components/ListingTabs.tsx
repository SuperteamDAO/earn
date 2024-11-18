import { ArrowRight, Info } from 'lucide-react';
import dynamic from 'next/dynamic';
import NextLink from 'next/link';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type User } from '@/interface/user';
import { useUser } from '@/store/user';
import { cn } from '@/utils';
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
  emoji?: string;
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
  if (!!(!user || !forYou || forYou.length === 0))
    return (
      <div className="ph-no-capture flex flex-col gap-1">
        {isListingsLoading ? (
          Array.from({ length: 8 }, (_, index) => (
            <ListingCardSkeleton key={index} />
          ))
        ) : !!bounties?.filter(filterFunction).length ? (
          bounties
            .filter(filterFunction)
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
    );

  return (
    <div>
      {!!forYou?.filter(filterFunction).length && (
        <div className="mb-4 border-b border-slate-200 pb-4">
          <div className="mb-2 flex w-fit items-center gap-3 font-semibold text-gray-900">
            <p className="flex-1">For You</p>
            <div className="text-gray-500">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-80">
                    List of top opportunities curated for you, based on your
                    skills, listing subscriptions and location.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="ph-no-capture flex flex-col gap-1">
            {isListingsLoading
              ? Array.from({ length: 8 }, (_, index) => (
                  <ListingCardSkeleton key={index} />
                ))
              : forYou
                  .filter(filterFunction)
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
          {isListingsLoading ? (
            Array.from({ length: 8 }, (_, index) => (
              <ListingCardSkeleton key={index} />
            ))
          ) : !!bounties?.filter(filterFunction).length ? (
            bounties
              .filter(filterFunction)
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
  emoji,
  title,
  viewAllLink,
  showViewAll = false,
  showNotifSub = true,
}: ListingTabsProps) => {
  const { user } = useUser();
  const tabs: TabProps[] = [
    {
      id: 'tab1',
      title: 'Open',
      posthog: 'open_listings',
      content: generateTabContent({
        user,
        title: 'Open',
        bounties: bounties,
        forYou: forYou,
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
      id: 'tab2',
      title: 'In Review',
      posthog: 'in review_listing',
      content: generateTabContent({
        user,
        title: 'In Review',
        bounties: bounties,
        forYou: forYou,
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
      id: 'tab3',
      title: 'Completed',
      posthog: 'completed_listing',
      content: generateTabContent({
        user,
        title: 'Completed',
        bounties: bounties,
        forYou: forYou,
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

  const [activeTab, setActiveTab] = useState<string>(tabs[0]!.id);
  const posthog = usePostHog();

  useEffect(() => {
    posthog.capture('open_listings');
  }, []);

  return (
    <div className="mb-10 mt-5">
      <div className="mb-4 flex items-center justify-between border-b-2 border-[#E2E8F0] pb-3">
        <div className="flex w-full items-center justify-between sm:justify-start">
          <div className="flex items-center">
            {emoji && (
              <img
                className="xs:flex xs:hidden mr-2 h-5 w-5"
                alt="emoji"
                src={emoji}
              />
            )}
            <p className="whitespace-nowrap pr-2 text-[14px] font-semibold text-[#334155] sm:text-[15px] md:text-[16px]">
              {title}
            </p>
          </div>
          <div className="flex items-center">
            <span className="mx-0 mr-3 text-[0.625rem] text-slate-300 sm:mx-3">
              |
            </span>
            {tabs.map((tab) => (
              <div
                className={cn(
                  'ph-no-capture relative cursor-pointer p-1 sm:p-2',
                  tab.id === activeTab ? 'text-slate-700' : 'text-slate-500',
                  tab.id === activeTab &&
                    "after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-[2px] after:bg-[#6366f1] after:content-['']",
                )}
                key={tab.id}
                onClick={() => {
                  posthog.capture(tab.posthog);
                  setActiveTab(tab.id);
                }}
              >
                <p className="whitespace-nowrap text-[13px] font-medium md:text-[14px]">
                  {tab.title}
                </p>
              </div>
            ))}
          </div>
        </div>
        {showViewAll && (
          <div className="ph-no-capture hidden sm:flex">
            <NextLink href={viewAllLink!}>
              <Button
                className="px-2 py-1 text-xs text-slate-400 md:text-sm"
                onClick={() => posthog.capture('viewall top_listngs')}
                size="sm"
                variant="ghost"
              >
                View All
              </Button>
            </NextLink>
          </div>
        )}
      </div>

      {tabs.map((tab) => tab.id === activeTab && tab.content)}

      {showViewAll && (
        <NextLink className="ph-no-capture" href={viewAllLink!}>
          <Button
            className="my-8 w-full border-slate-300 py-5 text-slate-400"
            onClick={() => posthog.capture('viewall bottom_listings')}
            size="sm"
            variant="outline"
          >
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </NextLink>
      )}
    </div>
  );
};
