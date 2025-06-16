import { useMutation } from '@tanstack/react-query';
import {
  Check,
  ChevronLeft,
  CircleHelp,
  Copy,
  Download,
  ExternalLink,
  Link2,
  Pencil,
  RefreshCw,
  Trash,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import React from 'react';
import { FaXTwitter } from 'react-icons/fa6';
import { toast } from 'sonner';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { PROJECT_NAME, TWITTER_HANDLE } from '@/constants/project';
import { tokenList } from '@/constants/tokenList';
import { useClipboard } from '@/hooks/use-clipboard';
import { useDisclosure } from '@/hooks/use-disclosure';
import { api } from '@/lib/api';
import { getBountyUrl } from '@/utils/bounty-urls';
import { cn } from '@/utils/cn';
import { tweetEmbedLink } from '@/utils/socialEmbeds';
import { getURL } from '@/utils/validUrl';

import { type Listing } from '@/features/listings/types';
import {
  formatDeadline,
  isDeadlineOver,
} from '@/features/listings/utils/deadline';
import { getColorStyles } from '@/features/listings/utils/getColorStyles';
import { getListingIcon } from '@/features/listings/utils/getListingIcon';
import { getListingStatus } from '@/features/listings/utils/status';

import { useCompleteSponsorship } from '../../mutations/useCompleteSponsorship';
import { ListingStatusModal } from '../ListingStatusModal';
import { SponsorPrize } from '../SponsorPrize';
import { CompleteSponsorshipModal } from './Modals/CompleteSponsorshipModal';
import { DeleteRestoreListingModal } from './Modals/DeleteRestoreListingModal';

interface Props {
  bounty: Listing | undefined;
  allTransactionsVerified: boolean;
  totalSubmissions: number;
  isHackathonPage?: boolean;
  onVerifyPayments: () => void;
  refetchBounty: () => void;
}

export const SubmissionHeader = ({
  bounty,
  totalSubmissions,
  isHackathonPage = false,
  allTransactionsVerified = false,
  onVerifyPayments,
  refetchBounty,
}: Props) => {
  const { data: session } = useSession();
  const completeSponsorship = useCompleteSponsorship(bounty?.id ?? '');

  const {
    isOpen: statusModalOpen,
    onOpen: statusModalOnOpen,
    onClose: statusModalOnClose,
  } = useDisclosure();

  const {
    isOpen: deleteModalOpen,
    onOpen: deleteModalOnOpen,
    onClose: deleteModalOnClose,
  } = useDisclosure();

  const deadline = formatDeadline(bounty?.deadline, bounty?.type);

  const listingPath = getBountyUrl(bounty);
  const { hasCopied, onCopy } = useClipboard(`${listingPath}`);

  const bountyStatus = getListingStatus(bounty);

  const listingLink =
    bounty?.type === 'grant'
      ? `${getURL()}grants/${bounty.slug}/`
      : getBountyUrl(bounty);

  const socialListingLink = (medium?: 'twitter' | 'telegram') =>
    `${listingLink}${medium ? `?utm_source=${PROJECT_NAME}&utm_medium=${medium}&utm_campaign=sharelisting/` : ``}`;

  const tweetShareContent = `Check out my newly added @${TWITTER_HANDLE} opportunity!

${socialListingLink('twitter')}
`;
  const twitterShareLink = tweetEmbedLink(tweetShareContent);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get(
        `/api/sponsor-dashboard/submission/export/`,
        {
          params: {
            listingId: bounty?.id,
          },
        },
      );
      return response.data;
    },
    onSuccess: (data) => {
      const url = data?.url || '';
      if (url) {
        window.open(url, '_blank');
        toast.success('CSV exported successfully');
      } else {
        toast.error('Export URL is empty');
      }
    },
    onError: (error) => {
      console.error('Export error:', error);
      toast.error('Failed to export CSV. Please try again.');
    },
  });

  const exportSubmissionsCsv = () => {
    exportMutation.mutate();
  };

  const pastDeadline = isDeadlineOver(bounty?.deadline);

  return (
    <>
      <ListingStatusModal
        isOpen={statusModalOpen}
        onClose={statusModalOnClose}
      />
      {isOpen && (
        <CompleteSponsorshipModal
          isOpen={isOpen}
          onClose={() => {
            onClose();
            refetchBounty();
          }}
          allTransactionsVerified={allTransactionsVerified}
          onCompleteListing={completeSponsorship.mutateAsync}
          onReviewTransactions={onVerifyPayments}
        />
      )}
      <DeleteRestoreListingModal
        isOpen={deleteModalOpen}
        onClose={deleteModalOnClose}
        listing={bounty}
        onSuccess={() => refetchBounty()}
      />
      <div className="mb-2">
        <Breadcrumb className="text-slate-400">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={
                    bounty?.type === 'hackathon'
                      ? `/dashboard/hackathon/`
                      : '/dashboard/listings'
                  }
                  className="flex items-center"
                >
                  <ChevronLeft className="mr-1 h-6 w-6" />
                  All Listings
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img className="h-6" alt="" src={getListingIcon(bounty?.type!)} />
          <p className="text-xl font-bold text-slate-800">{bounty?.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="text-slate-400"
            disabled={exportMutation.isPending}
            onClick={() => exportSubmissionsCsv()}
            variant="ghost"
          >
            {exportMutation.isPending ? (
              <>
                <span className="loading loading-spinner mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export CSV
              </>
            )}
          </Button>

          <Button
            className="text-slate-400"
            onClick={() => window.open(`${listingPath}`, '_blank')}
            variant="ghost"
          >
            <ExternalLink className="h-4 w-4" />
            View Listing
          </Button>
          {!!(
            (session?.user?.role === 'GOD' && bounty?.type !== 'grant') ||
            (bounty?.isPublished && !pastDeadline && bounty.type !== 'grant')
          ) && (
            <>
              <Link
                className="hover:no-underline"
                href={
                  bounty
                    ? `/dashboard/${isHackathonPage ? 'hackathon' : 'listings'}/${bounty.slug}/edit/`
                    : ''
                }
              >
                <Button variant="ghost" className="text-slate-400">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
              {session?.user?.role === 'GOD' && (
                <Button
                  variant="ghost"
                  className="text-slate-400"
                  onClick={deleteModalOnOpen}
                >
                  {bounty?.isArchived || !bounty?.isActive ? (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Restore
                    </>
                  ) : (
                    <>
                      <Trash className="h-4 w-4" />
                      Delete
                    </>
                  )}
                </Button>
              )}
            </>
          )}
          {bounty?.type === 'sponsorship' && !bounty.isWinnersAnnounced && (
            <Button onClick={onOpen}>Complete Sponsorship</Button>
          )}
        </div>
      </div>
      <Separator />
      <div className="mb-8 mt-4 flex items-center gap-12">
        <div>
          <p className="text-slate-500">Submissions</p>
          <p className="mt-3 font-semibold text-slate-600">
            {totalSubmissions}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Deadline</p>
          <p className="mt-3 whitespace-nowrap font-semibold text-slate-600">
            {deadline}
          </p>
        </div>
        <div>
          <div className="flex items-center gap-1">
            <p className="text-slate-500">Status</p>
            <Button
              variant="ghost"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={statusModalOnOpen}
            >
              <CircleHelp className="text-slate-400 hover:text-slate-600" />
            </Button>
          </div>
          <p
            className={cn(
              'mt-3 inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium',
              getColorStyles(bountyStatus).color,
              getColorStyles(bountyStatus).bgColor,
            )}
          >
            {bountyStatus}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Prize</p>
          <div className="mt-3 flex items-center justify-start gap-1">
            <img
              className="h-5 w-5 rounded-full"
              alt={'green dollar'}
              src={
                tokenList.filter((e) => e?.tokenSymbol === bounty?.token)[0]
                  ?.icon ?? '/assets/dollar.svg'
              }
            />
            <SponsorPrize
              compensationType={bounty?.compensationType}
              maxRewardAsk={bounty?.maxRewardAsk}
              minRewardAsk={bounty?.minRewardAsk}
              rewardAmount={bounty?.rewardAmount}
              className="font-semibold text-slate-700"
            />
            <p className="font-semibold text-slate-400">{bounty?.token}</p>
          </div>
        </div>
        <div className="ml-auto">
          <p className="text-slate-500">Share</p>
          <div className="mt-2 flex items-center gap-4">
            <div className="relative border-slate-100 bg-slate-50">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Link2 className="h-4 w-4 text-slate-400" />
              </div>

              <Input
                className="w-80 overflow-hidden text-ellipsis whitespace-nowrap border-slate-100 pl-10 pr-10 text-slate-500 focus-visible:ring-[#CFD2D7] focus-visible:ring-offset-0"
                readOnly
                value={`${listingPath}`}
              />

              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {hasCopied ? (
                  <Check className="h-4 w-4 text-slate-400" />
                ) : (
                  <Copy
                    className="h-5 w-5 cursor-pointer text-slate-400"
                    onClick={onCopy}
                  />
                )}
              </div>
            </div>
            <Link
              className="flex h-fit w-fit items-center gap-1 rounded-full bg-slate-500 p-1.5 text-white hover:bg-slate-400"
              href={twitterShareLink}
              target="_blank"
            >
              <FaXTwitter style={{ width: '0.9rem', height: '0.8rem' }} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};
