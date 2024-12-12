import axios from 'axios';
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

import { LoadingSection } from '@/components/shared/LoadingSection';
import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip } from '@/components/ui/tooltip';
import { tokenList } from '@/constants/tokenList';
import {
  formatDeadline,
  getColorStyles,
  getListingStatus,
  type ListingWithSubmissions,
} from '@/features/listings';
import {
  Banner,
  CreateListingModal,
  type SponsorStats,
} from '@/features/sponsor-dashboard';
import { useDisclosure } from '@/hooks/use-disclosure';
import { SponsorLayout } from '@/layouts/Sponsor';
import { useUser } from '@/store/user';
import { cn } from '@/utils';
import { dayjs } from '@/utils/dayjs';

const debounce = require('lodash.debounce');

export default function Hackathon() {
  const router = useRouter();
  const {
    isOpen: unpublishIsOpen,
    onOpen: unpublishOnOpen,
    onClose: unpublishOnClose,
  } = useDisclosure();
  const {
    isOpen: deleteDraftIsOpen,
    onOpen: deleteDraftOnOpen,
    onClose: deleteDraftOnClose,
  } = useDisclosure();
  const { user } = useUser();
  const [totalBounties, setTotalBounties] = useState(0);
  const [bounties, setBounties] = useState<ListingWithSubmissions[]>([]);
  const [bounty, setBounty] = useState<ListingWithSubmissions>({});
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isBountiesLoading, setIsBountiesLoading] = useState(true);
  const [startDate, setStartDate] = useState();
  const [searchText, setSearchText] = useState('');
  const [skip, setSkip] = useState(0);
  const length = 15;

  const [sponsorStats, setSponsorStats] = useState<SponsorStats>({});
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true);

  const debouncedSetSearchText = useRef(debounce(setSearchText, 300)).current;

  const { data: session } = useSession();

  useEffect(() => {
    return () => {
      debouncedSetSearchText.cancel();
    };
  }, [debouncedSetSearchText]);

  const getBounties = async () => {
    setIsBountiesLoading(true);
    try {
      const hackathonQuery = await axios.get('/api/hackathon/listings/', {
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
    if (user?.hackathonId || session?.user?.role === 'GOD') {
      getBounties();
    }
  }, [user?.hackathonId, skip, searchText]);

  useEffect(() => {
    const getSponsorStats = async () => {
      const sponsorData = await axios.get('/api/hackathon/stats');
      setSponsorStats(sponsorData.data);
      setIsStatsLoading(false);
    };
    getSponsorStats();
  }, [user?.hackathonId]);

  const handleUnpublish = async (unpublishedBounty: ListingWithSubmissions) => {
    setBounty(unpublishedBounty);
    unpublishOnOpen();
  };

  const hasHackathonStarted = startDate ? dayjs().isAfter(startDate) : true;
  const formattedDate = dayjs(startDate).format('MMM DD');

  const changeBountyStatus = async (status: boolean) => {
    setIsChangingStatus(true);
    try {
      const result = await axios.post(`/api/listings/unpublish/${bounty.id}/`, {
        isPublished: status,
      });

      const changedBountyIndex = bounties.findIndex(
        (b) => b.id === result.data.id,
      );
      const newBounties = bounties.map((b, index) =>
        changedBountyIndex === index
          ? { ...b, isPublished: result.data.isPublished }
          : b,
      );
      setBounties(newBounties);
      unpublishOnClose();
      setIsChangingStatus(false);
    } catch (e) {
      setIsChangingStatus(false);
    }
  };

  const handleViewSubmissions = (listing: string | undefined) => {
    router.push(`/dashboard/hackathon/${listing}/submissions/`);
  };

  const deleteSelectedDraft = async () => {
    try {
      await axios.post(`/api/listings/delete/${bounty.id}`);
      const update = bounties.filter((x) => x.id !== bounty.id);
      setBounties(update);
    } catch (e) {
      console.log(e);
    } finally {
      deleteDraftOnClose();
    }
  };

  const handleDeleteDraft = async (deleteBounty: ListingWithSubmissions) => {
    setBounty(deleteBounty);
    deleteDraftOnOpen();
  };

  const {
    isOpen: isOpenCreateListing,
    onOpen: onOpenCreateListing,
    onClose: onCloseCreateListing,
  } = useDisclosure();

  return (
    <SponsorLayout>
      <Dialog open={unpublishIsOpen} onOpenChange={unpublishOnClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unpublish Listing?</DialogTitle>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:opacity-100 disabled:pointer-events-none"
              onClick={unpublishOnClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </DialogHeader>

          <p className="text-slate-500">
            This listing will be hidden from the homepage once unpublished. Are
            you sure you want to unpublish this listing?
          </p>

          <DialogFooter className="gap-4">
            <Button onClick={unpublishOnClose} variant="ghost">
              Close
            </Button>
            <Button
              disabled={isChangingStatus}
              onClick={() => changeBountyStatus(false)}
            >
              {isChangingStatus ? (
                <>
                  <span className="loading loading-spinner" />
                  Unpublishing...
                </>
              ) : (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Unpublish
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteDraftIsOpen} onOpenChange={deleteDraftOnClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Draft?</DialogTitle>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:opacity-100 disabled:pointer-events-none"
              onClick={deleteDraftOnClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-slate-500">
              Are you sure you want to delete this draft listing?
            </p>
            <p className="text-slate-500">
              Note: If this was previously a published listing, all submissions
              or applications received for this listing will also be deleted.
            </p>
          </div>

          <DialogFooter className="gap-4">
            <Button onClick={deleteDraftOnClose} variant="ghost">
              Close
            </Button>
            <Button disabled={isChangingStatus} onClick={deleteSelectedDraft}>
              {isChangingStatus ? (
                <>
                  <span className="loading loading-spinner" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Confirm
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="placeholder:text-md border-slate-200 bg-white pl-9 placeholder:font-medium placeholder:text-slate-400 focus-visible:ring-brand-purple"
            onChange={(e) => debouncedSetSearchText(e.target.value)}
            placeholder="Search listing..."
            type="text"
          />
        </div>
      </div>
      {isBountiesLoading && <LoadingSection />}
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
            className="text-md mx-auto mb-48 mt-6 block w-[200px]"
            onClick={() => onOpenCreateListing()}
          >
            <Plus className="mr-2 h-3 w-3" />
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
                  <TableCell className="text-sm font-medium uppercase tracking-tight text-slate-400">
                    Track
                  </TableCell>
                  <TableCell className="text-sm font-medium uppercase tracking-tight text-slate-400">
                    Submissions
                  </TableCell>
                  <TableCell className="text-sm font-medium uppercase tracking-tight text-slate-400">
                    Deadline
                  </TableCell>
                  <TableCell className="text-sm font-medium uppercase tracking-tight text-slate-400">
                    Prize
                  </TableCell>
                  <TableCell className="text-sm font-medium uppercase tracking-tight text-slate-400">
                    Status
                  </TableCell>
                  <TableCell className="text-sm font-medium uppercase tracking-tight text-slate-400">
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
                      <TableCell className="max-w-96 whitespace-normal break-words font-medium text-slate-700">
                        <div className="flex items-center">
                          <img
                            className="mr-2 h-5 rounded-sm"
                            alt={`${currentBounty?.sponsor?.name}`}
                            src={currentBounty?.sponsor?.logo}
                          />
                          <a className="overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-medium text-slate-500">
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
                        <p
                          className={cn(
                            'inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium',
                            getColorStyles(bountyStatus).color,
                            getColorStyles(bountyStatus).bgColor,
                          )}
                        >
                          {bountyStatus}
                        </p>
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
                              contentProps={{
                                className: 'rounded-md bg-slate-500 text-white',
                              }}
                            >
                              <Button
                                className="text-[13px] font-medium text-[#6366F1] hover:bg-[#E0E7FF]"
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
                        {currentBounty.status === 'OPEN' &&
                          !currentBounty.isPublished && (
                            <Link
                              href={`/dashboard/hackathon/${currentBounty.slug}/edit/`}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[13px] font-medium text-slate-500 hover:bg-slate-200"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                            </Link>
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
                                  `${router.basePath}/listings/${currentBounty?.type}/${currentBounty.slug}`,
                                  '_blank',
                                )
                              }
                            >
                              <ExternalLink className="h-4 w-4" />
                              View Listing
                            </DropdownMenuItem>

                            {currentBounty.isPublished && (
                              <Link
                                className="no-underline"
                                href={`/dashboard/hackathon/${currentBounty.slug}/edit`}
                              >
                                <DropdownMenuItem className="flex items-center gap-2 py-2 text-sm font-medium text-slate-500">
                                  <Pencil className="h-4 w-4" />
                                  Edit Listing
                                </DropdownMenuItem>
                              </Link>
                            )}

                            {bountyStatus === 'Draft' && (
                              <DropdownMenuItem
                                className="flex items-center gap-2 py-2 text-sm font-medium text-slate-500"
                                onClick={() => handleDeleteDraft(currentBounty)}
                              >
                                <Trash className="h-4 w-4 text-gray-500" />
                                Delete Draft
                              </DropdownMenuItem>
                            )}

                            {!(
                              currentBounty.status === 'OPEN' &&
                              !currentBounty.isPublished
                            ) && (
                              <DropdownMenuItem
                                className="flex items-center gap-2 py-2 text-sm font-medium text-slate-500"
                                onClick={() => handleUnpublish(currentBounty)}
                              >
                                <EyeOff className="h-4 w-4" />
                                Unpublish
                              </DropdownMenuItem>
                            )}
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
