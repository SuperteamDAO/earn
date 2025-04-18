import { useMutation, useQuery } from '@tanstack/react-query';
import debounce from 'lodash.debounce';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Search,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

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
import { useDisclosure } from '@/hooks/use-disclosure';
import { SponsorLayout } from '@/layouts/Sponsor';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';

import { sponsorshipSubmissionStatus } from '@/features/listings/components/SubmissionsPage/SubmissionTable';
import { Banner } from '@/features/sponsor-dashboard/components/Banner';
import { CreateListingModal } from '@/features/sponsor-dashboard/components/CreateListingModal';
import {
  getColorStyles,
  SubmissionTable,
} from '@/features/sponsor-dashboard/components/SubmissionTable';
import {
  sponsorshipSubmissionsQuery,
  type SubmissionWithListingUser,
} from '@/features/sponsor-dashboard/queries/dashboard-submissions';
import { sponsorStatsQuery } from '@/features/sponsor-dashboard/queries/sponsor-stats';

const MemoizedListingTable = React.memo(SubmissionTable);

export default function SponsorListings() {
  const { data: session } = useSession();
  const { user } = useUser();
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [currentSort, setCurrentSort] = useState<{
    column: string;
    direction: 'asc' | 'desc' | null;
  }>({ column: 'createdAt', direction: 'desc' });
  const listingsPerPage = 15;

  const { data: sponsorStats, isLoading: isStatsLoading } = useQuery(
    sponsorStatsQuery(user?.currentSponsorId),
  );

  const { data: allSubmissions, isLoading: isSubmissionsLoading } = useQuery(
    sponsorshipSubmissionsQuery(user?.currentSponsorId),
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

  const filteredSubmissions = useMemo(() => {
    const filterSubmissionsByType = () => {
      if (!allSubmissions) return [];
      if (selectedTab === 'all') {
        return allSubmissions;
      }
      return allSubmissions.filter(
        (submission) => submission.listing.type === selectedTab,
      );
    };

    const filterSubmissionsByStatus = (
      submissions: SubmissionWithListingUser[],
    ) => {
      if (selectedStatus) {
        return submissions.filter(
          (submission) =>
            sponsorshipSubmissionStatus(submission) === selectedStatus,
        );
      }
      return submissions;
    };

    let filtered = filterSubmissionsByType();
    filtered = filterSubmissionsByStatus(filtered);

    if (searchText) {
      filtered = filtered.filter((submission) => {
        const result =
          submission.listing.title
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          submission.user.firstName
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          submission.user.lastName
            ?.toLowerCase()
            .includes(searchText.toLowerCase());

        if (!result) {
          return submission.id.toString().includes(searchText);
        }

        return result;
      });
    }

    if (currentSort.direction && currentSort.column) {
      return [...filtered].sort((a, b) => {
        const factor = currentSort.direction === 'desc' ? 1 : -1;

        switch (currentSort.column) {
          case 'id':
            const idA = a.listing.sequentialId || 0;
            const idB = b.listing.sequentialId || 0;
            return idA === idB
              ? (b.sequentialId - a.sequentialId) * factor
              : (idB - idA) * factor;

          case 'title':
            const titleA = a.listing.title || '';
            const titleB = b.listing.title || '';
            return titleA.localeCompare(titleB) * factor;

          case 'submittedBy':
            const authorA = a.user.username || '';
            const authorB = b.user.username || '';
            return authorA.localeCompare(authorB) * factor;

          case 'status':
            const statusA = sponsorshipSubmissionStatus(a) || '';
            const statusB = sponsorshipSubmissionStatus(b) || '';
            return statusA.localeCompare(statusB) * factor;

          case 'createdAt':
            const createdAtA = a.createdAt
              ? new Date(a.createdAt).getTime()
              : 0;
            const createdAtB = b.createdAt
              ? new Date(b.createdAt).getTime()
              : 0;
            return (createdAtB - createdAtA) * factor;

          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [allSubmissions, selectedTab, selectedStatus, searchText, currentSort]);

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(
        `/api/sponsor-dashboard/submissions/export`,
        {
          submissionIds: filteredSubmissions?.map(
            (submission) => submission.id,
          ),
        },
      );
      return response.data;
    },
    onSuccess: (data) => {
      const url = data?.url || '';
      window.open(url, '_blank');
      toast.success('CSV exported successfully');
    },
    onError: (error: any) => {
      if (error.response.data.error === 'No submissions selected') {
        toast.error('No submissions selected');
      } else {
        console.error(error);
        toast.error('Failed to export CSV. Please try again.');
      }
    },
  });

  const paginatedListings = useMemo(() => {
    return filteredSubmissions?.slice(
      currentPage * listingsPerPage,
      (currentPage + 1) * listingsPerPage,
    );
  }, [filteredSubmissions, currentPage, listingsPerPage]);

  const hasGrants = useMemo(() => {
    return allSubmissions?.some(
      (submission) => submission.listing.type === 'grant',
    );
  }, [allSubmissions]);

  const hasHackathons = useMemo(() => {
    return allSubmissions?.some(
      (submission) => submission.listing.type === 'hackathon',
    );
  }, [allSubmissions]);

  const ALL_FILTERS = useMemo(() => {
    const filters = [
      'Spam',
      'Rejected',
      'New',
      'Shortlisted',
      'Reviewed',
      'Approved',
      'Paid',
    ];
    if (session?.user.role === 'GOD') {
      filters.unshift('Deleted');
    }
    return filters;
  }, [user?.role]);

  const handleStatusFilterChange = useCallback((status: string | null) => {
    setSelectedStatus(status);
    setCurrentPage(0);
  }, []);

  const handleTabChange = useCallback((value: string) => {
    const valueToType = {
      all: 'all',
      bounties: 'bounty',
      projects: 'project',
      sponsorships: 'sponsorship',
      grants: 'grant',
      hackathons: 'hackathon',
    };

    const tabType = valueToType[value as keyof typeof valueToType] || 'all';
    setSelectedTab(tabType);
    setCurrentPage(0);
  }, []);

  const handleExportCSV = () => {
    exportMutation.mutate();
  };

  return (
    <SponsorLayout>
      <Banner stats={sponsorStats} isLoading={isStatsLoading} />
      <div className="mb-4 flex w-full items-center justify-between">
        <div className="flex items-center whitespace-nowrap">
          <p className="text-lg font-semibold text-slate-800">Submissions </p>
          <Separator className="mx-3 h-6 w-px bg-slate-300" />
          <p className="text-slate-500">
            The one place to manage your submissions
          </p>
        </div>
        <div className="flex w-full items-center justify-end gap-3">
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
                      getColorStyles(selectedStatus).color,
                      getColorStyles(selectedStatus).bg,
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
                      getColorStyles('Everything').bg,
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
                        getColorStyles(status).bg,
                      )}
                    >
                      {status}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 border border-slate-300 bg-transparent font-medium capitalize text-slate-500 hover:border-brand-purple hover:bg-transparent"
            onClick={handleExportCSV}
          >
            {exportMutation.isPending ? (
              <>
                <span className="loading loading-spinner" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-1 h-3 w-3" />
                Export CSV
              </>
            )}
          </Button>
          <div className="relative w-64">
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

      {isSubmissionsLoading && <LoadingSection />}
      {!isSubmissionsLoading && (
        <>
          <Tabs onValueChange={handleTabChange} defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="bounties">Bounties</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="sponsorships">Sponsorships</TabsTrigger>
              {hasGrants && <TabsTrigger value="grants">Grants</TabsTrigger>}
              {hasHackathons && (
                <TabsTrigger value="hackathons">Hackathons</TabsTrigger>
              )}
            </TabsList>
            <div className="h-0.5 w-full bg-slate-200" />
            <TabsContent value="all" className="px-0">
              <MemoizedListingTable
                submissions={paginatedListings}
                currentSort={currentSort}
                onSort={(column, direction) =>
                  setCurrentSort({ column, direction })
                }
              />
            </TabsContent>
            <TabsContent value="bounties" className="px-0">
              <MemoizedListingTable
                submissions={paginatedListings}
                currentSort={currentSort}
                onSort={(column, direction) =>
                  setCurrentSort({ column, direction })
                }
              />
            </TabsContent>
            <TabsContent value="projects" className="px-0">
              <MemoizedListingTable
                submissions={paginatedListings}
                currentSort={currentSort}
                onSort={(column, direction) =>
                  setCurrentSort({ column, direction })
                }
              />
            </TabsContent>
            <TabsContent value="sponsorships" className="px-0">
              <MemoizedListingTable
                submissions={paginatedListings}
                currentSort={currentSort}
                onSort={(column, direction) =>
                  setCurrentSort({ column, direction })
                }
              />
            </TabsContent>
            {hasGrants && (
              <TabsContent value="grants" className="px-0">
                <MemoizedListingTable
                  submissions={paginatedListings}
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
                  submissions={paginatedListings}
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
                    filteredSubmissions.length,
                  )}
                </span>{' '}
                of{' '}
                <span className="font-bold">{filteredSubmissions.length}</span>{' '}
                Submissions
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
                    filteredSubmissions.length
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
      {!isSubmissionsLoading && !allSubmissions?.length && (
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
            className="text-md mx-auto mb-48 mt-6 flex w-[200px]"
            onClick={onOpenCreateListing}
          >
            <Plus className="mr-2 h-3 w-3" />
            Create New Listing
          </Button>
        </>
      )}
      {!isSubmissionsLoading &&
        !!allSubmissions?.length &&
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
