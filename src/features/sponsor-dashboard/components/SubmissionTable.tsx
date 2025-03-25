import dayjs from 'dayjs';
import { Copy, ExternalLink, Eye, MoreVertical, User2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React from 'react';
import { toast } from 'sonner';

import { SortableTH } from '@/components/shared/sortable-th';
import { Button } from '@/components/ui/button';
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
import { Tooltip } from '@/components/ui/tooltip';
import { tokenList } from '@/constants/tokenList';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { getURL } from '@/utils/validUrl';

import { sponsorshipSubmissionStatus } from '@/features/listings/components/SubmissionsPage/SubmissionTable';
import { getListingIcon } from '@/features/listings/utils/getListingIcon';
import { getListingTypeLabel } from '@/features/listings/utils/status';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { type SubmissionWithListingUser } from '../queries/dashboard-submissions';
import { colorMap } from '../utils/statusColorMap';
import { ListingTh } from './ListingTable';

interface SubmissionTableProps {
  submissions: SubmissionWithListingUser[];
  currentSort: {
    column: string;
    direction: 'asc' | 'desc' | null;
  };
  onSort: (column: string, direction: 'asc' | 'desc' | null) => void;
}

const thClassName =
  'text-sm font-medium capitalize tracking-tight text-slate-400';

export const SubmissionTh = ({
  children,
  className,
}: {
  children?: string;
  className?: string;
}) => {
  return (
    <TableHead className={cn(thClassName, className)}>{children}</TableHead>
  );
};

export const getColorStyles = (status: string | null) => {
  if (status && status !== 'Everything') {
    return colorMap[status as keyof typeof colorMap];
  }
  return { bg: 'bg-gray-500', color: 'text-white' };
};

export const SubmissionTable = ({
  submissions,
  currentSort,
  onSort,
}: SubmissionTableProps) => {
  const posthog = usePostHog();
  const router = useRouter();
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success('Link Copied');
      },
      (err) => {
        console.error('Failed to copy text: ', err);
      },
    );
  };

  if (!submissions.length) return;

  return (
    <>
      <div className="w-full overflow-x-auto rounded-md border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100">
              <SubmissionTh />
              <SortableTH
                column="submittedBy"
                currentSort={currentSort}
                setSort={onSort}
                className={cn(thClassName)}
              >
                Contributor
              </SortableTH>
              <SortableTH
                column="title"
                currentSort={currentSort}
                setSort={onSort}
                className={cn(thClassName)}
              >
                Listing
              </SortableTH>
              <SubmissionTh>Ask</SubmissionTh>
              <SortableTH
                column="status"
                currentSort={currentSort}
                setSort={onSort}
                className={cn(thClassName)}
              >
                Status
              </SortableTH>
              <SortableTH
                column="createdAt"
                currentSort={currentSort}
                setSort={onSort}
                className={cn(thClassName)}
              >
                Submission Date
              </SortableTH>
              <ListingTh className="pl-6">Actions</ListingTh>
              <TableHead className="pl-0" />
            </TableRow>
          </TableHeader>
          <TableBody className="w-full">
            {submissions.map((submission) => {
              const submissionDate = dayjs(submission?.createdAt).format(
                "DD MMM'YY h:mm A",
              );
              const listingStatus = sponsorshipSubmissionStatus(submission);
              const isUsdBased = submission?.listing?.token === 'Any';
              const submissionLink = `${getURL()}listing/${submission?.listing?.slug}/submission/${submission.id}`;
              const token = isUsdBased
                ? submission.token
                : submission?.listing?.token;
              const tokenObject = tokenList.filter(
                (e) => e?.tokenSymbol === token,
              )[0];
              let ask = submission.ask;
              if (
                submission?.listing?.compensationType === 'fixed' &&
                submission.winnerPosition &&
                submission.isWinner
              ) {
                ask =
                  submission?.listing?.rewards?.[submission.winnerPosition] ??
                  0;
              }

              const listingSubmissionLink =
                submission?.listing?.type === 'grant'
                  ? `/dashboard/grants/${submission?.listing?.slug}/applications?submissionId=${submission.id}`
                  : `/dashboard/listings/${submission?.listing?.slug}/submissions?submissionId=${submission.id}`;

              const textColor = getColorStyles(listingStatus).color;
              const bgColor = getColorStyles(listingStatus).bg;
              const listingType = getListingTypeLabel(
                submission?.listing?.type!,
              );

              return (
                <TableRow key={submission?.id}>
                  <TableCell className="pr-0">
                    <Tooltip content={<p>{listingType}</p>}>
                      <img
                        className="mt-1.5 h-5 w-5 flex-shrink-0 rounded-full"
                        alt={`New ${listingType}`}
                        src={getListingIcon(submission?.listing?.type!)}
                        title={listingType}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell className="max-w-80 whitespace-normal break-words font-medium text-slate-700">
                    <Link
                      href={listingSubmissionLink}
                      className="flex items-center"
                    >
                      <EarnAvatar
                        id={submission?.user?.id}
                        avatar={submission?.user?.photo || undefined}
                      />
                      <div className="ml-2 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate whitespace-nowrap text-sm font-medium text-slate-700">
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
                        <p className="truncate text-xs font-medium text-slate-500">
                          {submission.user.publicKey}
                        </p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="py-2">
                    <p className="max-w-80 whitespace-normal break-words font-medium text-slate-700">
                      {submission?.listing?.title}
                    </p>
                  </TableCell>
                  <TableCell className="min-w-[225px] font-medium text-slate-700">
                    <div className="flex w-full items-center overflow-visible">
                      <img
                        src={tokenObject?.icon}
                        alt={tokenObject?.tokenSymbol}
                        className="h-4 w-4 rounded-full"
                      />
                      <span className="ml-1 truncate text-sm">
                        {isUsdBased && '$'}
                        {ask ? formatNumberWithSuffix(ask, 1) : '0'}
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
                  <TableCell className="items-center py-2">
                    <p
                      className={cn(
                        'inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium',
                        textColor,
                        bgColor,
                      )}
                    >
                      {listingStatus}
                    </p>
                  </TableCell>
                  <TableCell className="items-center py-2">
                    <p className="whitespace-nowrap text-sm font-medium text-slate-500">
                      {submissionDate}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ph-no-capture text-[13px] font-medium text-brand-purple hover:bg-brand-purple hover:text-white"
                      onClick={() => {
                        posthog.capture('sponsor_submission_view');
                        router.push(listingSubmissionLink);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      View Submission
                    </Button>
                  </TableCell>
                  <TableCell className="px-0 py-2">
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
                      <DropdownMenuContent align="end" className="max-w-60">
                        <DropdownMenuItem
                          className="cursor-pointer text-sm font-medium text-slate-500"
                          onClick={() => {
                            posthog.capture('sponsor_view_profile');
                            router.push(`/t/${submission?.user.username}`);
                          }}
                        >
                          <User2 className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>

                        {(submission?.listing?.type === 'sponsorship' ||
                          (submission?.listing?.type === 'bounty' &&
                            submission?.listing?.isWinnersAnnounced)) && (
                          <>
                            <DropdownMenuItem
                              className="cursor-pointer text-sm font-medium text-slate-500"
                              onClick={() => {
                                posthog.capture(
                                  'sponsor_public_submission_view',
                                );
                                router.push(submissionLink);
                              }}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Public Submission
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="cursor-pointer text-sm font-medium text-slate-500"
                              onClick={() => copyToClipboard(submissionLink)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Link
                            </DropdownMenuItem>
                          </>
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
    </>
  );
};
