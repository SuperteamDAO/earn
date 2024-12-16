import { useQuery } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getColorStyles,
  getListingStatus,
  type ListingWithSubmissions,
} from '@/features/listings';
import {
  Banner,
  CreateListingModal,
  dashboardQuery,
  ListingTable,
  sponsorStatsQuery,
} from '@/features/sponsor-dashboard';
import { useDisclosure } from '@/hooks/use-disclosure';
import { SponsorLayout } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';
import { cn } from '@/utils';

const MemoizedListingTable = React.memo(ListingTable);

export default function SponsorListings() {
  const { user } = useUser();
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const listingsPerPage = 15;

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
      setSelectedTab('all');
      setSelectedStatus(null);
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
      if (selectedTab === 'all') {
        return allListings;
      }
      return allListings.filter((listing) => listing.type === selectedTab);
    };

    const filterListingsByStatus = (listings: ListingWithSubmissions[]) => {
      if (selectedStatus) {
        return listings.filter(
          (listing) => getListingStatus(listing) === selectedStatus,
        );
      }
      return listings;
    };

    const filteredByType = filterListingsByType();
    const filteredByTypeAndStatus = filterListingsByStatus(filteredByType);

    if (searchText) {
      return filteredByTypeAndStatus.filter((listing) =>
        listing.title
          ? listing.title.toLowerCase().includes(searchText.toLowerCase())
          : false,
      );
    }
    return filteredByTypeAndStatus;
  }, [allListings, selectedTab, selectedStatus, searchText]);

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
    const filters = [
      'Draft',
      'In Progress',
      'In Review',
      'Fndn to Pay',
      'Payment Pending',
      'Completed',
    ];
    if (hasGrants) {
      filters.unshift('Ongoing');
    }
    return filters;
  }, [hasGrants]);

  const handleStatusFilterChange = useCallback((status: string | null) => {
    setSelectedStatus(status);
    setCurrentPage(0);
  }, []);

  const handleTabChange = useCallback((value: string) => {
    const valueToType = {
      all: 'all',
      bounties: 'bounty',
      projects: 'project',
      grants: 'grant',
      hackathons: 'hackathon',
    };

    const tabType = valueToType[value as keyof typeof valueToType] || 'all';
    setSelectedTab(tabType);
    setCurrentPage(0);
  }, []);

  return (
    <SponsorLayout>
      <Banner stats={sponsorStats} isLoading={isStatsLoading} />
      <div className="mb-4 flex w-full items-center justify-between">
        <div className="flex items-center whitespace-nowrap">
          <p className="text-lg font-semibold text-slate-800">My Listings </p>
          <Separator className="mx-3 h-6 w-px bg-slate-300" />
          <p className="text-slate-500">
            The one place to manage your listings
          </p>
        </div>
        <div className="flex w-full items-center justify-end gap-2">
          <div>
            <span className="mr-2 text-sm text-slate-500">
              Filter by status
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="h-9 border border-slate-300 bg-transparent font-medium capitalize text-slate-500 hover:border-brand-purple hover:bg-transparent"
                  variant="outline"
                >
                  <span
                    className={cn(
                      'inline-flex items-center whitespace-nowrap rounded-full px-3 text-center text-[11px] capitalize',
                      getColorStyles(selectedStatus!).color,
                      getColorStyles(selectedStatus!).bgColor,
                    )}
                  >
                    {selectedStatus || 'Everything'}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="border-slate-300">
                <DropdownMenuItem
                  className="focus:bg-slate-100"
                  onClick={() => handleStatusFilterChange(null)}
                >
                  <span
                    className={cn(
                      'inline-flex items-center whitespace-nowrap rounded-full px-3 text-center text-[11px] capitalize',
                      getColorStyles('Everything').color,
                      getColorStyles('Everything').bgColor,
                    )}
                  >
                    Everything
                  </span>
                </DropdownMenuItem>

                {ALL_FILTERS.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    className="focus:bg-slate-100"
                    onClick={() => handleStatusFilterChange(status)}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center whitespace-nowrap rounded-full px-3 text-center text-[11px] font-medium capitalize',
                        getColorStyles(status).color,
                        getColorStyles(status).bgColor,
                      )}
                    >
                      {status}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="relative ml-4 w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="placeholder:text-md border-slate-300 bg-white pl-9 placeholder:font-medium placeholder:text-slate-400 focus-visible:ring-brand-purple"
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
          <Tabs onValueChange={handleTabChange} defaultValue="all">
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
              <MemoizedListingTable listings={paginatedListings} />
            </TabsContent>
            <TabsContent value="bounties" className="px-0">
              <MemoizedListingTable listings={paginatedListings} />
            </TabsContent>
            <TabsContent value="projects" className="px-0">
              <MemoizedListingTable listings={paginatedListings} />
            </TabsContent>
            {hasGrants && (
              <TabsContent value="grants" className="px-0">
                <MemoizedListingTable listings={paginatedListings} />
              </TabsContent>
            )}
            {hasHackathons && (
              <TabsContent value="hackathons" className="px-0">
                <MemoizedListingTable listings={paginatedListings} />
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
            className="text-md mx-auto mb-48 mt-6 block w-[200px]"
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
