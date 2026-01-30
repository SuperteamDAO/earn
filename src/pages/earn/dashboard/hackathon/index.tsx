import debounce from 'lodash.debounce';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  MoreVertical,
  Plus,
  Search,
} from 'lucide-react';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { StatusPill } from '@/components/ui/status-pill';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip } from '@/components/ui/tooltip';
import { tokenList } from '@/constants/tokenList';
import { useDisclosure } from '@/hooks/use-disclosure';
import { SponsorLayout } from '@/layouts/Sponsor';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { dayjs } from '@/utils/dayjs';

import { type ListingWithSubmissions } from '@/features/listings/types';
import { formatDeadline } from '@/features/listings/utils/deadline';
import { getColorStyles } from '@/features/listings/utils/getColorStyles';
import { getListingStatus } from '@/features/listings/utils/status';
import { Banner } from '@/features/sponsor-dashboard/components/Banner';
import { CreateListingModal } from '@/features/sponsor-dashboard/components/CreateListingModal';
import { ListingTableSkeleton } from '@/features/sponsor-dashboard/components/ListingTableSkeleton';
import { type SponsorStats } from '@/features/sponsor-dashboard/types';

export default function Hackathon() {
  const router = useRouter();
  const { user } = useUser();
  const [totalBounties, setTotalBounties] = useState(0);
  const [bounties, setBounties] = useState<ListingWithSubmissions[]>([]);
  const [isBountiesLoading, setIsBountiesLoading] = useState(true);
  const [startDate, setStartDate] = useState();
  const [searchText, setSearchText] = useState('');
  const [skip, setSkip] = useState(0);
  const length = 15;

  const [sponsorStats, setSponsorStats] = useState<SponsorStats>({});
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true);

  const debouncedSetSearchTextRef = useRef<ReturnType<typeof debounce> | null>(
    null,
  );

  useEffect(() => {
    debouncedSetSearchTextRef.current = debounce(setSearchText, 300);
    return () => {
      debouncedSetSearchTextRef.current?.cancel();
    };
  }, []);

  const debouncedSetSearchText = useCallback((value: string) => {
    debouncedSetSearchTextRef.current?.(value);
  }, []);

  const getBounties = async () => {
    setIsBountiesLoading(true);
    try {
      const hackathonQuery = await api.get('/api/hackathon/listings/', {
        params: {
          searchText,
          skip,
          take: length,
        },
      });
      const hackathonData = hackathonQuery.data;
      setTotalBounties(hackathonData.total);
      setStartDate(hackathonData.startDate);
      setBounties(hackathonData.listings);
      setIsBountiesLoading(false);
    } catch (error) {
      setIsBountiesLoading(false);
    }
  };

  useEffect(() => {
    if (user?.hackathonId || user?.role === 'GOD') {
      setTimeout(() => {
        getBounties();
      }, 0);
    }
  }, [user?.hackathonId, skip, searchText]);

  useEffect(() => {
    const getSponsorStats = async () => {
      const sponsorData = await api.get('/api/hackathon/stats');
      setSponsorStats({
        ...sponsorData.data,
        totalHackathonRewards: sponsorData.data.totalRewardAmount,
        totalHackathonTracks: sponsorData.data.totalListings,
        totalHackathonSubmissions: sponsorData.data.totalSubmissions,
      });
      setIsStatsLoading(false);
    };
    getSponsorStats();
  }, [user?.hackathonId]);

  const hasHackathonStarted = startDate ? dayjs().isAfter(startDate) : true;
  const formattedDate = dayjs(startDate).format('MMM DD');

  const handleViewSubmissions = (listing: string | undefined) => {
    router.push(`/earn/dashboard/hackathon/${listing}/submissions/`);
  };

  const {
    isOpen: isOpenCreateListing,
    onOpen: onOpenCreateListing,
    onClose: onCloseCreateListing,
  } = useDisclosure();

  return (
    <SponsorLayout>
      <Banner stats={sponsorStats} isHackathon isLoading={isStatsLoading} />
      <div className="mb-4 flex w-full justify-between">
        <div className="flex items-center gap-3">
          <p className="text-lg font-semibold text-slate-800">All Tracks</p>
          <div className="mx-1 h-[60%] border-r border-slate-200" />
          <p className="text-slate-500">
            Review hackathon tracks and submissions here
          </p>
        </div>
        <div className="relative w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="placeholder:text-md focus-visible:ring-brand-purple border-slate-200 bg-white pl-9 placeholder:font-medium placeholder:text-slate-400"
            onChange={(e) => debouncedSetSearchText(e.target.value)}
            placeholder="Search listing..."
            type="text"
          />
        </div>
      </div>
      {isBountiesLoading && <ListingTableSkeleton rows={10} />}
      {!isBountiesLoading && !bounties?.length && (
        <>
          <CreateListingModal
            isOpen={isOpenCreateListing}
            onClose={onCloseCreateListing}
          />
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
            onClick={() => onOpenCreateListing()}
          >
            <Plus className="mr-1 h-3 w-3" />
            Create New Listing
          </Button>
        </>
      )}
      {!isBountiesLoading && !!bounties?.length && (
        <>
          <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="text-slate-100">
                  <TableCell className="text-sm font-medium tracking-tight text-slate-400 uppercase">
                    Track
                  </TableCell>
                  <TableCell className="text-sm font-medium tracking-tight text-slate-400 uppercase">
                    Submissions
                  </TableCell>
                  <TableCell className="text-sm font-medium tracking-tight text-slate-400 uppercase">
                    Deadline
                  </TableCell>
                  <TableCell className="text-sm font-medium tracking-tight text-slate-400 uppercase">
                    Prize
                  </TableCell>
                  <TableCell className="text-sm font-medium tracking-tight text-slate-400 uppercase">
                    Status
                  </TableCell>
                  <TableCell className="text-sm font-medium tracking-tight text-slate-400 uppercase">
                    Actions
                  </TableCell>
                  <TableCell className="pl-0" />
                </TableRow>
              </TableHeader>
              <TableBody className="w-full">
                {bounties.map((currentBounty) => {
                  const deadline = formatDeadline(
                    currentBounty?.deadline,
                    currentBounty?.type,
                  );

                  const bountyStatus = getListingStatus(currentBounty);

                  return (
                    <TableRow key={currentBounty?.id}>
                      <TableCell className="max-w-96 font-medium wrap-break-word whitespace-normal text-slate-700">
                        <div className="flex items-center">
                          <img
                            className="mr-2 h-5 rounded-sm"
                            alt={`${currentBounty?.sponsor?.name}`}
                            src={currentBounty?.sponsor?.logo}
                          />
                          <a className="overflow-hidden text-[15px] font-medium text-ellipsis whitespace-nowrap text-slate-500">
                            {currentBounty.title}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <p className="text-center text-sm font-medium text-slate-500">
                          {currentBounty?._count?.Submission || 0}
                        </p>
                      </TableCell>
                      <TableCell className="items-center py-2">
                        <p className="text-sm font-medium text-slate-500">
                          {deadline}
                        </p>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center justify-start gap-1">
                          <img
                            className="h-5 w-5 rounded-full"
                            alt={'green dollar'}
                            src={
                              tokenList.filter(
                                (e) => e?.tokenSymbol === currentBounty.token,
                              )[0]?.icon ?? '/assets/dollar.svg'
                            }
                          />
                          <p className="text-sm font-medium text-slate-700">
                            {(currentBounty.rewardAmount || 0).toLocaleString(
                              'en-US',
                            )}
                          </p>
                          <p className="text-sm font-medium text-slate-400">
                            {currentBounty.token}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="items-center py-2">
                        <StatusPill
                          className="w-fit"
                          color={getColorStyles(bountyStatus).color}
                          backgroundColor={getColorStyles(bountyStatus).bgColor}
                          borderColor={getColorStyles(bountyStatus).borderColor}
                        >
                          {bountyStatus}
                        </StatusPill>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        {currentBounty.status === 'OPEN' &&
                          currentBounty.isPublished && (
                            <Tooltip
                              content={
                                !hasHackathonStarted
                                  ? `Submissions Open ${formattedDate}`
                                  : null
                              }
                              disabled={hasHackathonStarted}
                              contentProps={{
                                className: 'rounded-md',
                              }}
                            >
                              <Button
                                className="text-brand-purple text-[13px] font-medium hover:bg-indigo-100"
                                disabled={!hasHackathonStarted}
                                onClick={() =>
                                  handleViewSubmissions(currentBounty.slug)
                                }
                                size="sm"
                                variant="ghost"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Submissions
                              </Button>
                            </Tooltip>
                          )}
                      </TableCell>
                      <TableCell className="px-0 py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              className="border-none hover:bg-slate-100"
                              size="sm"
                              variant="ghost"
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Options</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="flex items-center gap-2 py-2 text-sm font-medium text-slate-500"
                              onClick={() =>
                                window.open(
                                  `${router.basePath}/earn/listing/${currentBounty.slug}`,
                                  '_blank',
                                )
                              }
                            >
                              <ExternalLink className="h-4 w-4" />
                              View Listing
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="mt-6 flex items-center justify-end">
            <p className="mr-4 text-sm text-slate-400">
              <span className="font-bold">{skip + 1}</span> -{' '}
              <span className="font-bold">
                {Math.min(skip + length, totalBounties)}
              </span>{' '}
              of <span className="font-bold">{totalBounties}</span> Listings
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={skip <= 0}
                onClick={() =>
                  skip >= length ? setSkip(skip - length) : setSkip(0)
                }
              >
                <ChevronLeft className="mr-2 h-5 w-5" />
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={
                  totalBounties <= skip + length ||
                  (skip > 0 && skip % length !== 0)
                }
                onClick={() => skip % length === 0 && setSkip(skip + length)}
              >
                Next
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </SponsorLayout>
  );
}
