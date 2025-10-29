import {
  Copy,
  DollarSign,
  ExternalLink,
  Eye,
  EyeOff,
  MoreVertical,
  Pencil,
  PencilLine,
  Trash,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import React, { useState } from 'react';
import { toast } from 'sonner';

import IoDuplicateOutline from '@/components/icons/IoDuplicateOutline';
import { SortableTH } from '@/components/shared/sortable-th';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusPill } from '@/components/ui/status-pill';
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
import { useDisclosure } from '@/hooks/use-disclosure';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { getURL } from '@/utils/validUrl';

import { grantAmount } from '@/features/grants/utils/grantAmount';
import { BoostButton } from '@/features/listing-builder/components/Form/Boost/BoostButton';
import { isListingEditable } from '@/features/listing-builder/utils/isListingEditable';
import { type ListingWithSubmissions } from '@/features/listings/types';
import { formatDeadline } from '@/features/listings/utils/deadline';
import { getColorStyles } from '@/features/listings/utils/getColorStyles';
import { getListingIcon } from '@/features/listings/utils/getListingIcon';
import {
  getListingStatus,
  getListingTypeLabel,
} from '@/features/listings/utils/status';

import { DeleteDraftModal } from './Modals/DeleteDraftModal';
import { UnpublishModal } from './Modals/UnpublishModal';
import { VerifyPaymentModal } from './Modals/VerifyPayment';
import { SponsorPrize } from './SponsorPrize';

interface ListingTableProps {
  listings: ListingWithSubmissions[];
  currentSort: {
    column: string;
    direction: 'asc' | 'desc' | null;
  };
  onSort: (column: string, direction: 'asc' | 'desc' | null) => void;
}

const thClassName =
  'text-sm font-medium capitalize tracking-tight text-slate-400';

const ListingTh = ({
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

export const ListingTable = ({
  listings,
  currentSort,
  onSort,
}: ListingTableProps) => {
  const [selectedListing, setSelectedListing] =
    useState<ListingWithSubmissions>({});

  const router = useRouter();

  const { user } = useUser();

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
  const {
    isOpen: verifyPaymentIsOpen,
    onOpen: verifyPaymentOnOpen,
    onClose: verifyPaymentOnClose,
  } = useDisclosure();

  const handleUnpublish = async (
    unpublishedListing: ListingWithSubmissions,
  ) => {
    setSelectedListing(unpublishedListing);
    unpublishOnOpen();
  };

  const handleDeleteDraft = async (deleteListing: ListingWithSubmissions) => {
    setSelectedListing(deleteListing);
    deleteDraftOnOpen();
  };

  const handleVerifyPayment = async (listing: ListingWithSubmissions) => {
    setSelectedListing(listing);
    verifyPaymentOnOpen();
  };

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

  if (!listings.length) return;

  return (
    <>
      <UnpublishModal
        listing={selectedListing}
        unpublishIsOpen={unpublishIsOpen}
        unpublishOnClose={unpublishOnClose}
      />

      <DeleteDraftModal
        deleteDraftIsOpen={deleteDraftIsOpen}
        deleteDraftOnClose={deleteDraftOnClose}
        listingId={selectedListing.id}
        listingType={selectedListing.type}
      />

      <VerifyPaymentModal
        listing={selectedListing}
        isOpen={verifyPaymentIsOpen}
        onClose={verifyPaymentOnClose}
      />

      <div className="w-full overflow-x-auto rounded-md border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100">
              <ListingTh />
              <SortableTH
                column="title"
                currentSort={currentSort}
                setSort={onSort}
                className={cn(thClassName)}
              >
                Listing Name
              </SortableTH>
              <SortableTH
                column="submissions"
                currentSort={currentSort}
                setSort={onSort}
                className={cn(thClassName, 'text-center')}
              >
                Submissions
              </SortableTH>
              <SortableTH
                column="deadline"
                currentSort={currentSort}
                setSort={onSort}
                className={cn(thClassName)}
              >
                Deadline
              </SortableTH>
              <ListingTh>Prize</ListingTh>
              <ListingTh>Status</ListingTh>
              <ListingTh className="pl-6">Actions</ListingTh>
              <TableHead className="pl-0" />
              <TableHead className="pl-0" />
            </TableRow>
          </TableHeader>
          <TableBody className="w-full">
            {listings.map((listing) => {
              const listingType = getListingTypeLabel(
                listing?.type ?? 'bounty',
              );

              const deadline = formatDeadline(listing?.deadline, listing?.type);

              const listingStatus = getListingStatus(listing);
              const listingLabel =
                listingStatus === 'Draft'
                  ? 'Draft'
                  : getListingTypeLabel(listing?.type!);

              const listingLink =
                listing?.type === 'grant'
                  ? `${getURL()}grants/${listing.slug}`
                  : `${getURL()}listing/${listing.slug}`;

              const listingSubmissionLink =
                listing.type === 'grant'
                  ? `/dashboard/grants/${listing.slug}/applications/`
                  : `/dashboard/listings/${listing.slug}/submissions/`;

              const textColor = getColorStyles(listingStatus).color;
              const bgColor = getColorStyles(listingStatus).bgColor;
              const borderColor = getColorStyles(listingStatus).borderColor;

              return (
                <TableRow key={listing?.id}>
                  <TableCell className="pr-0">
                    <Tooltip content={<p>{listingType}</p>}>
                      {getListingIcon(
                        listing.type!,
                        'fill-slate-400 size-3.5 mt-1',
                      )}
                    </Tooltip>
                  </TableCell>
                  <TableCell className="max-w-80 font-medium break-words whitespace-normal text-slate-700">
                    {(() => {
                      const isClickable =
                        listing.isPublished ||
                        isListingEditable({ listing, user });
                      const href = listing.isPublished
                        ? listingSubmissionLink
                        : `/dashboard/listings/${listing.slug}/edit`;
                      const onClick = listing.isPublished
                        ? () => posthog.capture('submissions_sponsor')
                        : () => posthog.capture('edit listing_sponsor');

                      const titleElement = (
                        <p
                          className={`overflow-hidden text-[15px] font-medium text-ellipsis whitespace-nowrap text-slate-500 ${
                            isClickable ? 'cursor-pointer hover:underline' : ''
                          }`}
                          title={listing.title}
                        >
                          {listing.title}
                        </p>
                      );

                      return isClickable ? (
                        <Link
                          className="ph-no-capture"
                          href={href}
                          onClick={onClick}
                        >
                          {titleElement}
                        </Link>
                      ) : (
                        titleElement
                      );
                    })()}
                  </TableCell>
                  <TableCell className="py-2">
                    <p className="text-center text-sm font-medium text-slate-500">
                      {listing.submissionCount}
                    </p>
                  </TableCell>
                  <TableCell className="items-center py-2">
                    <p className="text-sm font-medium whitespace-nowrap text-slate-500">
                      {deadline}
                    </p>
                  </TableCell>
                  <TableCell className="py-2 pr-6">
                    <div className="flex items-center justify-start gap-1">
                      <img
                        className="h-5 w-5 rounded-full"
                        alt={'green dollar'}
                        src={
                          tokenList.filter(
                            (e) => e?.tokenSymbol === listing.token,
                          )[0]?.icon ?? '/assets/dollar.svg'
                        }
                      />

                      {listing?.type === 'grant' && (
                        <p className="text-sm font-medium whitespace-nowrap text-slate-700">
                          {grantAmount({
                            maxReward: listing?.maxRewardAsk!,
                            minReward: listing?.minRewardAsk!,
                          })}
                        </p>
                      )}
                      <SponsorPrize
                        compensationType={listing?.compensationType}
                        maxRewardAsk={listing?.maxRewardAsk}
                        minRewardAsk={listing?.minRewardAsk}
                        rewardAmount={listing?.rewardAmount}
                        className="text-sm font-medium text-slate-700"
                      />

                      <p className="text-sm font-medium text-slate-400">
                        {listing.token}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="items-center py-2">
                    <StatusPill
                      className={cn(
                        'cursor-default py-1 text-[0.65rem]',
                        listingStatus === 'Payment Pending' && 'cursor-pointer',
                      )}
                      color={textColor}
                      backgroundColor={bgColor}
                      borderColor={borderColor}
                      onClick={() => {
                        if (listingStatus !== 'Payment Pending') return;
                        handleVerifyPayment(listing);
                      }}
                    >
                      {listingStatus}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="px-0 py-2">
                    {listing.status === 'OPEN' && !!listing.isPublished ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ph-no-capture text-brand-purple hover:bg-brand-purple text-[13px] font-medium hover:text-white"
                        onClick={() => {
                          posthog.capture('submissions_sponsor');
                          router.push(listingSubmissionLink);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        {listing?.type === 'grant' ? (
                          <span>Applications</span>
                        ) : (
                          <span>Submissions</span>
                        )}
                      </Button>
                    ) : isListingEditable({ listing, user }) ? (
                      <Link href={`/dashboard/listings/${listing.slug}/edit`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[13px] font-medium text-slate-500 hover:bg-slate-200"
                          onClick={() => {
                            posthog.capture('edit listing_sponsor');
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                    ) : (
                      <></>
                    )}
                  </TableCell>
                  <TableCell className="px-0 py-2">
                    {listingStatus === 'In Progress' ? (
                      <BoostButton listing={listing} showDate={false} />
                    ) : (
                      <></>
                    )}
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
                          onClick={() => window.open(listingLink, '_blank')}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View {listingLabel}
                        </DropdownMenuItem>

                        {!!listing.isPublished && (
                          <DropdownMenuItem
                            className="cursor-pointer text-sm font-medium text-slate-500"
                            onClick={() => copyToClipboard(listingLink)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Link
                          </DropdownMenuItem>
                        )}

                        {isListingEditable({ listing, user }) && (
                          <Link
                            className="block"
                            href={`/dashboard/listings/${listing.slug}/edit`}
                          >
                            <DropdownMenuItem className="cursor-pointer text-sm font-medium text-slate-500">
                              <PencilLine className="mr-2 h-4 w-4" />
                              Edit {listingLabel}
                            </DropdownMenuItem>
                          </Link>
                        )}

                        {(listing.type === 'bounty' ||
                          listing.type === 'project') && (
                          <DropdownMenuItem
                            className="ph-no-capture cursor-pointer text-sm font-medium text-slate-500"
                            onClick={() => {
                              posthog.capture('duplicate listing_sponsor');
                              window.open(
                                `${router.basePath}/dashboard/listings/${listing.slug}/duplicate`,
                                '_blank',
                              );
                            }}
                          >
                            <IoDuplicateOutline className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                        )}

                        {listingStatus === 'Draft' &&
                          listing?.type !== 'grant' && (
                            <DropdownMenuItem
                              className="cursor-pointer text-sm font-medium text-slate-500"
                              onClick={() => handleDeleteDraft(listing)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete Draft
                            </DropdownMenuItem>
                          )}

                        {listingStatus === 'Payment Pending' &&
                          listing?.type !== 'grant' && (
                            <DropdownMenuItem
                              className="cursor-pointer text-sm font-medium whitespace-nowrap text-slate-500"
                              onClick={() => handleVerifyPayment(listing)}
                            >
                              <DollarSign className="mr-2 h-4 w-4" />
                              Update Payment Status
                            </DropdownMenuItem>
                          )}

                        {listing.status === 'OPEN' &&
                          !!listing.isPublished &&
                          !listing.isWinnersAnnounced && (
                            <DropdownMenuItem
                              className="cursor-pointer text-sm font-medium text-slate-500"
                              onClick={() => handleUnpublish(listing)}
                            >
                              <EyeOff className="mr-2 h-4 w-4" />
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
    </>
  );
};
