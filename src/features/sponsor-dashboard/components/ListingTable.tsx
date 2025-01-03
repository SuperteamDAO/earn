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
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React, { useState } from 'react';
import { IoDuplicateOutline } from 'react-icons/io5';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { cn } from '@/utils/cn';
import { getURL } from '@/utils/validUrl';

import { grantAmount } from '@/features/grants/utils/grantAmount';
import { type ListingWithSubmissions } from '@/features/listings/types';
import {
  formatDeadline,
  isDeadlineOver,
} from '@/features/listings/utils/deadline';
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
}

export const ListingTable = ({ listings }: ListingTableProps) => {
  const [selectedListing, setSelectedListing] =
    useState<ListingWithSubmissions>({});

  const router = useRouter();
  const posthog = usePostHog();
  const { data: session } = useSession();

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

  const ListingTh = ({
    children,
    className,
  }: {
    children?: string;
    className?: string;
  }) => {
    return (
      <TableHead
        className={cn(
          'text-sm font-medium capitalize tracking-[-0.02em] text-slate-400',
          className,
        )}
      >
        {children}
      </TableHead>
    );
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
        listingId={selectedListing.id}
        unpublishIsOpen={unpublishIsOpen}
        unpublishOnClose={unpublishOnClose}
        listingType={selectedListing.type}
      />
      <DeleteDraftModal
        deleteDraftIsOpen={deleteDraftIsOpen}
        deleteDraftOnClose={deleteDraftOnClose}
        listingId={selectedListing.id}
        listingType={selectedListing.type}
      />
      <VerifyPaymentModal
        listing={selectedListing}
        setListing={setSelectedListing}
        isOpen={verifyPaymentIsOpen}
        onClose={verifyPaymentOnClose}
        listingId={selectedListing.id}
        listingType={selectedListing.type}
      />
      <div className="w-full overflow-x-auto rounded-md border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100">
              <ListingTh />
              <ListingTh>Listing Name</ListingTh>
              <ListingTh className="text-center">Submissions</ListingTh>
              <ListingTh>Deadline</ListingTh>
              <ListingTh>Prize</ListingTh>
              <ListingTh>Status</ListingTh>
              <ListingTh className="pl-6">Actions</ListingTh>
              <TableHead className="pl-0" />
            </TableRow>
          </TableHeader>
          <TableBody className="w-full">
            {listings.map((listing) => {
              const listingType = getListingTypeLabel(
                listing?.type ?? 'bounty',
              );

              const deadline = formatDeadline(listing?.deadline, listing?.type);

              const pastDeadline = isDeadlineOver(listing?.deadline);

              const listingStatus = getListingStatus(listing);
              const listingLabel =
                listingStatus === 'Draft'
                  ? 'Draft'
                  : getListingTypeLabel(listing?.type!);

              const listingLink =
                listing?.type === 'grant'
                  ? `${getURL()}grants/${listing.slug}`
                  : `${getURL()}listings/${listing?.type}/${listing.slug}`;

              const listingSubmissionLink =
                listing.type === 'grant'
                  ? `/dashboard/grants/${listing.slug}/applications/`
                  : `/dashboard/listings/${listing.slug}/submissions/`;

              const textColor = getColorStyles(listingStatus).color;
              const bgColor = getColorStyles(listingStatus).bgColor;

              return (
                <TableRow key={listing?.id}>
                  <TableCell className="pr-0">
                    <Tooltip content={<p>{listingType}</p>}>
                      <img
                        className="mt-1.5 h-5 w-5 flex-shrink-0 rounded-full"
                        alt={`New ${listingType}`}
                        src={getListingIcon(listing.type!)}
                        title={listingType}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell className="max-w-80 whitespace-normal break-words font-medium text-slate-700">
                    <Link
                      className={cn(
                        'ph-no-capture',
                        !listing.isPublished && 'pointer-events-none',
                      )}
                      href={listingSubmissionLink}
                      onClick={() => {
                        posthog.capture('submissions_sponsor');
                      }}
                    >
                      <p
                        className="cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-medium text-slate-500 hover:underline"
                        title={listing.title}
                      >
                        {listing.title}
                      </p>
                    </Link>
                  </TableCell>
                  <TableCell className="py-2">
                    <p className="text-center text-sm font-medium text-slate-500">
                      {listing.submissionCount}
                    </p>
                  </TableCell>
                  <TableCell className="items-center py-2">
                    <p className="whitespace-nowrap text-sm font-medium text-slate-500">
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
                            (e) => e?.tokenSymbol === listing.token,
                          )[0]?.icon ?? '/assets/dollar.svg'
                        }
                      />
                      {listing?.type === 'grant' && (
                        <p className="whitespace-nowrap text-sm font-medium text-slate-700">
                          {grantAmount({
                            minReward: listing?.minRewardAsk!,
                            maxReward: listing?.maxRewardAsk!,
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
                  <TableCell className="px-3 py-2">
                    {listing.status === 'OPEN' && !!listing.isPublished ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ph-no-capture text-[13px] font-medium text-brand-purple hover:bg-brand-purple hover:text-white"
                        onClick={() => {
                          posthog.capture('submissions_sponsor');
                          router.push(listingSubmissionLink);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        {listing?.type === 'grant'
                          ? 'Applications'
                          : 'Submissions'}
                      </Button>
                    ) : (session?.user?.role === 'GOD' &&
                        listing.type !== 'grant' &&
                        !listing.isPublished) ||
                      (!pastDeadline &&
                        listing.type !== 'grant' &&
                        listing.status === 'OPEN') ? (
                      <Link href={`/dashboard/listings/${listing.slug}/edit/`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[13px] font-medium text-slate-500 hover:bg-slate-200"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                    ) : (
                      <p className="px-3 text-slate-400">—</p>
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

                        {!!(
                          (session?.user?.role === 'GOD' &&
                            listing.type !== 'grant') ||
                          (!pastDeadline &&
                            listing.type !== 'grant' &&
                            listing.status === 'OPEN')
                        ) && (
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
                              className="cursor-pointer whitespace-nowrap text-sm font-medium text-slate-500"
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
