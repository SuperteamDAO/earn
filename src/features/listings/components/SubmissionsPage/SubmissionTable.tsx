import axios from 'axios';
import { Copy, Eye, Heart, MessageCircle, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import React, {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { toast } from 'sonner';

import { SortableTH } from '@/components/shared/sortable-th';
import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { KycComponent } from '@/components/ui/KycComponent';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { tokenList } from '@/constants/tokenList';
import { useDynamicClipboard } from '@/hooks/use-clipboard';
import type { SubmissionWithUser } from '@/interface/submission';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';
import { getURL } from '@/utils/validUrl';

import { ListingTh } from '@/features/sponsor-dashboard/components/ListingTable';
import { colorMap } from '@/features/sponsor-dashboard/utils/statusColorMap';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { type Listing } from '../../types';
import {
  sponsorshipSubmissionStatus,
  SubmissionDetails,
} from './SubmissionDetails';

const thClassName =
  'text-sm font-medium capitalize tracking-tight text-slate-400';

interface Props {
  bounty: Listing;
  submissions: SubmissionWithUser[];
  endTime: string;
  setUpdate: Dispatch<SetStateAction<boolean>>;
}

export const LikeAndComment = ({
  id,
  likes,
  setUpdate,
}: {
  id: string;
  likes: { id: string; date: number }[];
  setUpdate: Dispatch<SetStateAction<boolean>>;
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useUser();
  const [commentCount, setCommentCount] = useState<number>(0);

  useEffect(() => {
    axios
      .get(`/api/comment/${id}`)
      .then((res) => setCommentCount(res.data.count))
      .catch((err) => console.log(err));
  }, [id]);

  const handleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsLoading(true);

    const likePromise = axios
      .post('/api/submission/like/', { id })
      .then()
      .finally(() => {
        setIsLoading(false);
        setUpdate((prev: boolean) => !prev);
      });

    toast.promise(likePromise, {
      loading: 'Liking the submission...',
      success: () => {
        const likeAdded = likes?.some((e) => e.id === user?.id)
          ? 'Like removed'
          : 'Liked submission';
        return `${likeAdded}`;
      },
      error: 'Error while liking submission',
    });
  };

  return (
    <div className="flex w-full items-center gap-4">
      <Button
        className={cn(
          'z-10 flex h-auto items-center gap-2 p-0 text-sm font-medium',
          'text-slate-500 hover:bg-transparent',
        )}
        variant="ghost"
        disabled={isLoading}
        onClick={(e) => {
          e.stopPropagation();
          handleLike(e);
        }}
        type="button"
      >
        <Heart
          className={cn(
            'h-4 w-4 stroke-2',
            !likes?.find((e) => e.id === user?.id)
              ? 'fill-white text-slate-500'
              : 'fill-rose-600 text-rose-600',
          )}
        />
        {likes?.length || 0}
      </Button>
      <Link
        className={cn(
          'z-10 flex h-auto items-center gap-2 p-0 text-sm font-medium',
          'text-slate-500 hover:bg-transparent',
        )}
        href={`/feed/submission/${id}`}
        onClick={(e) => e.stopPropagation()}
      >
        <MessageCircle className="h-4 w-4 cursor-pointer fill-white stroke-2" />
        {commentCount}
      </Link>
    </div>
  );
};

export const SubmissionTable = ({
  bounty,
  submissions,
  endTime,
  setUpdate,
}: Props) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionWithUser | null>(null);
  const isSponsorship = bounty.type === 'sponsorship';
  const [currentSort, setCurrentSort] = useState<{
    column: string;
    direction: 'asc' | 'desc' | null;
  }>({ column: '', direction: null });
  const { onCopy: onCopySubmissionLink } = useDynamicClipboard();

  const filteredSubmissions = useMemo(() => {
    if (currentSort.direction && currentSort.column) {
      return [...submissions].sort((a, b) => {
        const factor = currentSort.direction === 'asc' ? 1 : -1;

        switch (currentSort.column) {
          case 'user':
            const nameA = `${a.user?.firstName} ${a.user?.lastName}` || '';
            const nameB = `${b.user?.firstName} ${b.user?.lastName}` || '';
            const name = nameA.localeCompare(nameB) * factor;

            if (name !== 0) {
              return name;
            }

            const createdAtA = a.createdAt || '';
            const createdAtB = b.createdAt || '';
            return createdAtA.localeCompare(createdAtB) * factor;

          case 'ask':
            let rewardA = a.ask ?? 0;
            let rewardB = b.ask ?? 0;
            if (
              bounty.compensationType === 'fixed' &&
              a.winnerPosition &&
              a.isWinner
            ) {
              rewardA = bounty.rewards?.[a.winnerPosition] ?? 0;
            }
            if (
              bounty.compensationType === 'fixed' &&
              b.winnerPosition &&
              b.isWinner
            ) {
              rewardB = bounty.rewards?.[b.winnerPosition] ?? 0;
            }
            return (rewardB - rewardA) * factor;

          case 'status':
            const statusA = sponsorshipSubmissionStatus(a);
            const statusB = sponsorshipSubmissionStatus(b);
            return statusA.localeCompare(statusB) * factor;

          default:
            return 0;
        }
      });
    }

    return submissions;
  }, [submissions, currentSort]);

  const isUsdBased = bounty.token === 'Any';

  const onSort = (column: string, direction: 'asc' | 'desc' | null) => {
    setCurrentSort({ column, direction });
  };

  const handleCopySubmissionLink = (submissionLink: string) => {
    onCopySubmissionLink(submissionLink);
    toast.success('Submission link copied', {
      duration: 1500,
    });
  };

  return (
    <>
      {isDetailsOpen && selectedSubmission && (
        <SubmissionDetails
          open={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          submission={selectedSubmission}
          bounty={bounty}
        />
      )}
      <div className="mt-10 flex min-h-screen w-full flex-col items-center md:items-start">
        {isSponsorship || dayjs(endTime).valueOf() < Date.now() ? (
          <div className="w-full overflow-x-auto rounded-md border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100">
                  <SortableTH
                    column="user"
                    currentSort={currentSort}
                    setSort={onSort}
                    className={cn(thClassName)}
                  >
                    Submission
                  </SortableTH>
                  <SortableTH
                    column="ask"
                    currentSort={currentSort}
                    setSort={onSort}
                    className={cn(thClassName)}
                  >
                    {bounty.compensationType === 'fixed' ? 'Reward' : 'Ask'}
                  </SortableTH>
                  <SortableTH
                    column="status"
                    currentSort={currentSort}
                    setSort={onSort}
                    className={cn(thClassName)}
                  >
                    Status
                  </SortableTH>
                  <ListingTh>Community</ListingTh>
                  <ListingTh>Actions</ListingTh>
                  <TableHead className="pl-0" />
                </TableRow>
              </TableHeader>
              {
                <TableBody className="w-full">
                  {filteredSubmissions.map((submission) => {
                    const submissionStatus =
                      sponsorshipSubmissionStatus(submission);
                    const submissionLink = `${getURL()}feed/submission/${submission.id}?openModal=true`;
                    const token = isUsdBased ? submission.token : bounty.token;
                    const tokenObject = tokenList.filter(
                      (e) => e?.tokenSymbol === token,
                    )[0];
                    let ask = submission.ask;
                    if (
                      bounty.compensationType === 'fixed' &&
                      submission.winnerPosition &&
                      submission.isWinner
                    ) {
                      ask = bounty.rewards?.[submission.winnerPosition] ?? 0;
                    }

                    return (
                      <TableRow key={submission.id}>
                        <TableCell className="pr-0">
                          <div className="flex items-center">
                            <EarnAvatar
                              id={submission?.user?.id}
                              avatar={submission?.user?.photo || undefined}
                            />
                            <div className="ml-2">
                              <div className="flex items-center gap-2">
                                <p className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-slate-700">
                                  {`${submission?.user?.firstName} ${submission?.user?.lastName}`}
                                </p>
                                {submission?.user?.publicKey && (
                                  <KycComponent
                                    address={submission.user.publicKey}
                                    imageOnly
                                    xs
                                  />
                                )}
                              </div>
                              <p className="overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium text-slate-500">
                                {dayjs(submission.createdAt).format(
                                  "D MMM' YY h:MM A",
                                )}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-80 whitespace-normal break-words font-medium text-slate-700">
                          <div className="flex w-full items-center overflow-visible">
                            <img
                              src={tokenObject?.icon}
                              alt={tokenObject?.tokenSymbol}
                              className="h-4 w-4 rounded-full"
                            />
                            <span className="ml-1 text-sm">
                              {isUsdBased && '$'}
                              {ask ? ask.toLocaleString('en-us') : '0'}
                              <span className="text-slate-400">
                                {isUsdBased && ' to be paid in'}
                              </span>
                              <span
                                className={cn(
                                  'ml-1',
                                  !isUsdBased && 'font-semibold text-slate-400',
                                )}
                              >
                                {token}
                              </span>
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <span
                            className={cn(
                              'inline-flex whitespace-nowrap rounded-full px-3 py-1 text-center text-[10px] capitalize',
                              colorMap[
                                submissionStatus as keyof typeof colorMap
                              ].bg,
                              colorMap[
                                submissionStatus as keyof typeof colorMap
                              ].color,
                            )}
                          >
                            {submissionStatus}
                          </span>
                        </TableCell>
                        <TableCell className="items-center py-2">
                          <LikeAndComment
                            id={submission.id}
                            likes={submission.like}
                            setUpdate={setUpdate}
                          />
                        </TableCell>
                        <TableCell className="px-0 py-2">
                          <div className="flex items-center justify-between">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ph-no-capture text-[13px] font-medium text-brand-purple hover:bg-brand-purple hover:text-white"
                              onClick={() => {
                                setSelectedSubmission(submission);
                                setIsDetailsOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              Submission
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  className="hover:bg-slate-100"
                                  size="icon"
                                  variant="ghost"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="max-w-60"
                              >
                                <DropdownMenuItem
                                  className="cursor-pointer text-sm font-medium text-slate-500"
                                  onClick={() => {
                                    handleCopySubmissionLink(submissionLink);
                                  }}
                                >
                                  <Copy className="mr-1 h-4 w-4" />
                                  Copy Link
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              }
            </Table>
          </div>
        ) : (
          <div className="flex h-[25rem] w-full flex-col items-center justify-center gap-5">
            <ExternalImage alt={'submission'} src={'/icons/submission.svg'} />
            <p className="text-center text-2xl font-semibold text-gray-800">
              Submissions are not public until the submission deadline
              <br />
              has closed. Check back soon!
            </p>
          </div>
        )}
      </div>
    </>
  );
};
