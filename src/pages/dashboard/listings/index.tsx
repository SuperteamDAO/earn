import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LucideListFilter,
  Plus,
  Search,
} from 'lucide-react';
import { type GetServerSideProps } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { StatusPill } from '@/components/ui/status-pill';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDisclosure } from '@/hooks/use-disclosure';
import { SponsorLayout } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';

import { type ListingWithSubmissions } from '@/features/listings/types';
import { getColorStyles } from '@/features/listings/utils/getColorStyles';
import { getListingStatus } from '@/features/listings/utils/status';
import { Banner } from '@/features/sponsor-dashboard/components/Banner';
import { CreateListingModal } from '@/features/sponsor-dashboard/components/CreateListingModal';
import { ListingTable } from '@/features/sponsor-dashboard/components/ListingTable';
import { dashboardQuery } from '@/features/sponsor-dashboard/queries/dashboard';
import { sponsorStatsQuery } from '@/features/sponsor-dashboard/queries/sponsor-stats';

const MemoizedListingTable = React.memo(ListingTable);

type DashboardTab = 'all' | 'bounty' | 'project' | 'grant' | 'hackathon';
type DashboardStatus =
  | 'Draft'
  | 'In Progress'
  | 'In Review'
  | 'Fndn to Pay'
  | 'Payment Pending'
  | 'Completed';

const DEFAULT_TAB: DashboardTab = 'all';

export default function SponsorListings({ tab: queryTab }: { tab: string }) {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsFromHook = useSearchParams();

  const searchParams = useMemo(
    () => searchParamsFromHook ?? new URLSearchParams(),
    [searchParamsFromHook],
  );

  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [currentSort, setCurrentSort] = useState<{
    column: string;
    direction: 'asc' | 'desc' | null;
  }>({ column: '', direction: null });
  const listingsPerPage = 15;

  const activeTab = useMemo((): DashboardTab => {
    const tabParam = searchParams.get('tab');
    if (
      tabParam &&
      ['all', 'bounty', 'project', 'grant', 'hackathon'].includes(tabParam)
    ) {
      return tabParam as DashboardTab;
    }
    return DEFAULT_TAB;
  }, [searchParams]);

  const activeStatus = useMemo((): DashboardStatus | null => {
    const statusParam = searchParams.get('status');
    if (
      statusParam &&
      [
        'Draft',
        'In Progress',
        'In Review',
        'Fndn to Pay',
        'Payment Pending',
        'Completed',
      ].includes(statusParam)
    ) {
      return statusParam as DashboardStatus;
    }
    return null;
  }, [searchParams]);

  const updateQueryParams = useCallback(
    (updates: { tab?: DashboardTab; status?: DashboardStatus | null }) => {
      const newParams = new URLSearchParams(Array.from(searchParams.entries()));

      if (updates.tab !== undefined) {
        if (updates.tab === DEFAULT_TAB) {
          newParams.delete('tab');
        } else {
          newParams.set('tab', updates.tab);
        }
      }

      if (updates.status !== undefined) {
        if (updates.status === null) {
          newParams.delete('status');
        } else {
          newParams.set('status', updates.status);
        }
      }

      const queryString = newParams.toString();
      const newPath = `${pathname}${queryString ? `?${queryString}` : ''}`;
      router.replace(newPath, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const { data: sponsorStats, isLoading: isStatsLoading } = useQuery(
    sponsorStatsQuery(user?.currentSponsorId),
  );

  const { data: allListings, isLoading: isListingsLoading } = useQuery(
    dashboardQuery(user?.currentSponsorId),
  );

  const debouncedSetSearchText = useRef(debounce(setSearchText, 300)).current;

  useEffect(() => {
    return () => {
      debouncedSetSearchText.cancel();
    };
  }, [debouncedSetSearchText]);

  useEffect(() => {
    if (user?.currentSponsorId) {
      setSearchText('');
      setCurrentPage(0);
    }
  }, [user?.currentSponsorId]);

  const {
    isOpen: isOpenCreateListing,
    onOpen: onOpenCreateListing,
    onClose: onCloseCreateListing,
  } = useDisclosure();

  const filteredListings = useMemo(() => {
    const filterListingsByType = () => {
      if (!allListings) return [];
      if (activeTab === 'all') {
        return allListings;
      }
      return allListings.filter((listing) => listing.type === activeTab);
    };

    const filterListingsByStatus = (listings: ListingWithSubmissions[]) => {
      if (activeStatus) {
        return listings.filter(
          (listing) => getListingStatus(listing) === activeStatus,
        );
      }
      return listings;
    };

    let filtered = filterListingsByType();
    filtered = filterListingsByStatus(filtered);

    if (searchText) {
      filtered = filtered.filter((listing) =>
        listing.title
          ? listing.title.toLowerCase().includes(searchText.toLowerCase())
          : false,
      );
    }

    if (currentSort.direction && currentSort.column) {
      return [...filtered].sort((a, b) => {
        const factor = currentSort.direction === 'asc' ? 1 : -1;

        switch (currentSort.column) {
          case 'title':
            const titleA = a.title || '';
            const titleB = b.title || '';
            return titleA.localeCompare(titleB) * factor;

          case 'submissions':
            const submissionsA = a.submissionCount ?? 0;
            const submissionsB = b.submissionCount ?? 0;
            return (submissionsB - submissionsA) * factor;

          case 'deadline':
            const deadlineA = a.deadline ? new Date(a.deadline).getTime() : 0;
            const deadlineB = b.deadline ? new Date(b.deadline).getTime() : 0;
            return (deadlineB - deadlineA) * factor;

          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [allListings, activeTab, activeStatus, searchText, currentSort]);

  const paginatedListings = useMemo(() => {
    return filteredListings?.slice(
      currentPage * listingsPerPage,
      (currentPage + 1) * listingsPerPage,
    );
  }, [filteredListings, currentPage, listingsPerPage]);

  const hasGrants = useMemo(() => {
    return allListings?.some((listing) => listing.type === 'grant');
  }, [allListings]);

  const hasHackathons = useMemo(() => {
    return allListings?.some((listing) => listing.type === 'hackathon');
  }, [allListings]);

  const ALL_FILTERS = useMemo(() => {
    const filters: DashboardStatus[] = [
      'Draft',
      'In Progress',
      'In Review',
      'Fndn to Pay',
      'Payment Pending',
      'Completed',
    ];
    return filters;
  }, []);

  const handleStatusFilterChange = useCallback(
    (status: DashboardStatus | null) => {
      updateQueryParams({ status });
      setCurrentPage(0);
    },
    [updateQueryParams],
  );

  const handleTabChange = useCallback(
    (value: string) => {
      const valueToType = {
        all: 'all' as const,
        bounties: 'bounty' as const,
        projects: 'project' as const,
        grants: 'grant' as const,
        hackathons: 'hackathon' as const,
      };

      const tabType = valueToType[value as keyof typeof valueToType] || 'all';
      updateQueryParams({ tab: tabType });
      setCurrentPage(0);
    },
    [updateQueryParams],
  );

  useEffect(() => {
    if (queryTab && queryTab !== activeTab) {
      handleTabChange(queryTab);
    }
  }, [queryTab, activeTab, handleTabChange]);

  return (
    <SponsorLayout>
      <Banner stats={sponsorStats} isLoading={isStatsLoading} />
      <div className="mb-4 flex w-full flex-col justify-between gap-2 lg:flex-row lg:items-center">
        <div className="flex items-center whitespace-nowrap">
          <p className="text-lg font-semibold text-slate-800">My Listings </p>
          <Separator className="mx-3 h-6 w-px bg-slate-300" />
          <p className="text-slate-500">
            The one place to manage your listings
          </p>
        </div>
        <div className="flex w-full items-center gap-2 lg:justify-end">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-9 items-center justify-between rounded-lg border border-slate-300 bg-transparent px-2 text-sm font-medium text-slate-500 capitalize shadow-xs transition-all duration-300 ease-in-out hover:border-slate-200 data-[state=open]:rounded-b-none data-[state=open]:border-slate-200 xl:min-w-40">
                  {activeStatus && (
                    <StatusPill
                      color={getColorStyles(activeStatus!).color}
                      backgroundColor={getColorStyles(activeStatus!).bgColor}
                      borderColor={getColorStyles(activeStatus!).borderColor}
                      className="w-fit font-normal"
                    >
                      {activeStatus}
                    </StatusPill>
                  )}
                  {!activeStatus && (
                    <span className="flex items-center text-xs font-normal text-slate-500">
                      <LucideListFilter className="mr-1.5 size-3.5" />
                      Filter by status
                    </span>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                sideOffset={-1}
                className="min-w-40 rounded-t-none px-0 py-2"
              >
                <DropdownMenuItem
                  className="cursor-pointer border-0 px-2 py-1.5 text-center text-sm"
                  onClick={() => handleStatusFilterChange(null)}
                >
                  <StatusPill
                    color={getColorStyles('All').color}
                    backgroundColor={getColorStyles('All').bgColor}
                    borderColor={getColorStyles('All').borderColor}
                    className="w-fit"
                  >
                    All
                  </StatusPill>
                </DropdownMenuItem>

                {ALL_FILTERS.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    className="cursor-pointer border-0 px-2 py-1.5 text-center text-sm"
                    onClick={() => handleStatusFilterChange(status)}
                  >
                    <StatusPill
                      color={getColorStyles(status).color}
                      backgroundColor={getColorStyles(status).bgColor}
                      borderColor={getColorStyles(status).borderColor}
                      className="w-fit"
                    >
                      {status}
                    </StatusPill>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="relative w-64 lg:w-35 xl:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              className="focus-visible:ring-brand-purple h-9 rounded-lg border-slate-300 bg-white pl-9 font-normal placeholder:text-xs placeholder:text-slate-500"
              onChange={(e) => debouncedSetSearchText(e.target.value)}
              placeholder="Search listing..."
              type="text"
            />
          </div>
        </div>
      </div>

      {isListingsLoading && <LoadingSection />}
      {!isListingsLoading && (
        <>
          <Tabs
            value={
              activeTab === 'all'
                ? 'all'
                : activeTab === 'bounty'
                  ? 'bounties'
                  : activeTab === 'project'
                    ? 'projects'
                    : activeTab === 'grant'
                      ? 'grants'
                      : 'hackathons'
            }
            onValueChange={handleTabChange}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="bounties">Bounties</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              {hasGrants && <TabsTrigger value="grants">Grants</TabsTrigger>}
              {hasHackathons && (
                <TabsTrigger value="hackathons">Hackathons</TabsTrigger>
              )}
            </TabsList>
            <div className="h-0.5 w-full bg-slate-200" />
            <TabsContent value="all" className="px-0">
              <MemoizedListingTable
                listings={paginatedListings}
                currentSort={currentSort}
                onSort={(column, direction) =>
                  setCurrentSort({ column, direction })
                }
              />
            </TabsContent>
            <TabsContent value="bounties" className="px-0">
              <MemoizedListingTable
                listings={paginatedListings}
                currentSort={currentSort}
                onSort={(column, direction) =>
                  setCurrentSort({ column, direction })
                }
              />
            </TabsContent>
            <TabsContent value="projects" className="px-0">
              <MemoizedListingTable
                listings={paginatedListings}
                currentSort={currentSort}
                onSort={(column, direction) =>
                  setCurrentSort({ column, direction })
                }
              />
            </TabsContent>
            {hasGrants && (
              <TabsContent value="grants" className="px-0">
                <MemoizedListingTable
                  listings={paginatedListings}
                  currentSort={currentSort}
                  onSort={(column, direction) =>
                    setCurrentSort({ column, direction })
                  }
                />
              </TabsContent>
            )}
            {hasHackathons && (
              <TabsContent value="hackathons" className="px-0">
                <MemoizedListingTable
                  listings={paginatedListings}
                  currentSort={currentSort}
                  onSort={(column, direction) =>
                    setCurrentSort({ column, direction })
                  }
                />
              </TabsContent>
            )}
          </Tabs>
          <CreateListingModal
            isOpen={isOpenCreateListing}
            onClose={onCloseCreateListing}
          />
          {!!paginatedListings?.length && (
            <div className="mt-6 flex items-center justify-end">
              <p className="mr-4 text-sm text-slate-400">
                <span className="font-bold">
                  {currentPage * listingsPerPage + 1}
                </span>{' '}
                -{' '}
                <span className="font-bold">
                  {Math.min(
                    (currentPage + 1) * listingsPerPage,
                    filteredListings.length,
                  )}
                </span>{' '}
                of <span className="font-bold">{filteredListings.length}</span>{' '}
                Listings
              </p>
              <div className="flex gap-4">
                <Button
                  disabled={currentPage <= 0}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  size="sm"
                  variant="outline"
                >
                  <ChevronLeft className="mr-2 h-5 w-5" />
                  Previous
                </Button>

                <Button
                  disabled={
                    (currentPage + 1) * listingsPerPage >=
                    filteredListings.length
                  }
                  onClick={() => setCurrentPage(currentPage + 1)}
                  size="sm"
                  variant="outline"
                >
                  Next
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      {!isListingsLoading && !allListings?.length && (
        <>
          <ExternalImage
            className="mx-auto mt-32 w-32"
            alt={'talent empty'}
            src={'/bg/talent-empty.svg'}
          />
          <p className="mx-auto mt-5 text-center text-lg font-semibold text-slate-600">
            Create your first listing
          </p>
          <p className="mx-auto text-center font-medium text-slate-400">
            and start getting contributions
          </p>
          <Button
            className="text-md mx-auto mt-6 mb-48 flex w-[200px]"
            onClick={onOpenCreateListing}
          >
            <Plus className="mr-2 h-3 w-3" />
            Create New Listing
          </Button>
        </>
      )}
      {!isListingsLoading &&
        !!allListings?.length &&
        !paginatedListings.length && (
          <>
            <ExternalImage
              className="mx-auto mt-32 w-32"
              alt={'talent empty'}
              src={'/bg/talent-empty.svg'}
            />
            <p className="mx-auto mt-5 text-center text-lg font-semibold text-slate-600">
              Zero Results
            </p>
            <p className="mx-auto text-center font-medium text-slate-400">
              No results matching the current filter
            </p>
          </>
        )}
    </SponsorLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  let tab: string = 'all';
  if (typeof query.tab === 'string') {
    tab = query.tab;
  }
  return {
    props: {
      tab,
    },
  };
};
