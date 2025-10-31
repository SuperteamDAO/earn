import { TooltipArrow } from '@radix-ui/react-tooltip';
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  CopyIcon,
  Download,
  ExternalLink,
  MoreVertical,
  Pencil,
  Sheet,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { toast } from 'sonner';

import { ShinyButton } from '@/components/shared/ShinyButton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusPill } from '@/components/ui/status-pill';
import { Tooltip } from '@/components/ui/tooltip';
import { PDTG } from '@/constants/Telegram';
import { useDisclosure } from '@/hooks/use-disclosure';
import { type SubmissionWithUser } from '@/interface/submission';
import { api } from '@/lib/api';
import { SubmissionLabels, SubmissionStatus } from '@/prisma/enums';
import { useUser } from '@/store/user';
import { cn } from '@/utils/cn';
import { getURL } from '@/utils/validUrl';

import { BoostButton } from '@/features/listing-builder/components/Form/Boost/BoostButton';
import { type Listing } from '@/features/listings/types';
import { isDeadlineOver } from '@/features/listings/utils/deadline';
import { getColorStyles } from '@/features/listings/utils/getColorStyles';
import { getListingIcon } from '@/features/listings/utils/getListingIcon';
import { getListingStatus } from '@/features/listings/utils/status';
import { VerifyPaymentModal } from '@/features/sponsor-dashboard/components/Modals/VerifyPayment';

import { ExportSheetsModal } from '../Modals/ExportSheetsModal';
import { UnpublishModal } from '../Modals/UnpublishModal';
import AiReviewBountiesSubmissionsModal from './Modals/AiReviewBounties';
import AiReviewProjectApplicationsModal from './Modals/AiReviewProjects';

interface Props {
  bounty: Listing | undefined;
  isHackathonPage?: boolean;
  remainings: { podiums: number; bonus: number } | null;
  submissions: SubmissionWithUser[];
  onWinnersAnnounceOpen: () => void;
  activeTab: string;
}

export const SubmissionHeader = ({
  bounty,
  isHackathonPage = false,
  remainings,
  submissions,
  onWinnersAnnounceOpen,
  activeTab,
}: Props) => {
  const router = useRouter();
  const { user } = useUser();

  const {
    isOpen: verifyPaymentIsOpen,
    onOpen: verifyPaymentOnOpen,
    onClose: verifyPaymentOnClose,
  } = useDisclosure();

  const {
    isOpen: unpublishIsOpen,
    onOpen: unpublishOnOpen,
    onClose: unpublishOnClose,
  } = useDisclosure();

  const {
    isOpen: exportSheetsIsOpen,
    onOpen: exportSheetsOnOpen,
    onClose: exportSheetsOnClose,
  } = useDisclosure();

  const handleVerifyPayment = () => {
    verifyPaymentOnOpen();
  };

  const listingPath = `listing/${bounty?.slug}`;

  const bountyStatus = getListingStatus(bounty);
  const isProject = bounty?.type === 'project';

  const afterAnnounceDate =
    bounty?.type === 'hackathon'
      ? dayjs().isAfter(bounty?.Hackathon?.announceDate)
      : true;

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
    onSuccess: async (data) => {
      const url = data?.url || '';
      if (url) {
        try {
          const response = await fetch(url, {
            headers: {
              Accept: 'text/csv,application/octet-stream',
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to download: ${response.status}`);
          }

          const blob = await response.blob();

          const blobUrl = window.URL.createObjectURL(
            new Blob([blob], { type: 'text/csv' }),
          );

          const link = document.createElement('a');
          link.href = blobUrl;
          link.setAttribute('download', `${bounty?.slug || 'submissions'}.csv`);

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          window.URL.revokeObjectURL(blobUrl);

          toast.success('CSV exported successfully');
        } catch (error) {
          console.error('Download error:', error);
          toast.error('Failed to download CSV. Please try again.');
        }
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success('Link Copied', {
          duration: 3000,
        });
      },
      (err) => {
        console.error('Failed to copy text: ', err);
      },
    );
  };

  const getEditText = () => {
    if (bounty?.type === 'grant') return null;
    if (bounty?.type === 'bounty') return 'Edit Bounty';
    if (bounty?.type === 'project') return 'Edit Project';
    if (bounty?.type === 'hackathon') return 'Edit Track';
    return 'Edit';
  };

  const getListingUrl = () => {
    if (bounty?.type === 'grant') {
      return `${getURL()}grants/${bounty.slug}`;
    }
    return `${getURL()}listing/${bounty?.slug}`;
  };

  const pastDeadline = isDeadlineOver(bounty?.deadline);

  const totalPodiumSpots = remainings
    ? remainings.podiums + remainings.bonus
    : 0;
  const rejectedOrSpamSubmissions = submissions.filter(
    (s) =>
      s.status === SubmissionStatus.Rejected ||
      s.label === SubmissionLabels.Spam,
  ).length;
  const eligibleSubmissions = submissions.length - rejectedOrSpamSubmissions;
  const showWarning =
    !!remainings &&
    !bounty?.isWinnersAnnounced &&
    totalPodiumSpots > eligibleSubmissions &&
    bountyStatus === 'In Review';

  return (
    <div className="mb-2 flex items-center justify-between gap-12">
      <div>
        <Breadcrumb className="text-slate-400">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="flex cursor-pointer items-center gap-2"
                onClick={() => router.back()}
              >
                <ChevronLeft className="size-6" />
                All Listings
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="mb-2 flex items-center gap-2">
          <div className="ml-1 flex items-center gap-2">
            {getListingIcon(bounty?.type!, 'size-5')}
            <p className="text-xl font-bold text-slate-800">{bounty?.title}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="cursor-pointer rounded-md p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-500">
                <MoreVertical className="h-4 w-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 text-slate-500">
              {!isHackathonPage && (
                <>
                  <DropdownMenuItem
                    disabled={exportMutation.isPending}
                    onClick={() => exportSubmissionsCsv()}
                    className="cursor-pointer"
                  >
                    {exportMutation.isPending ? (
                      <>
                        <span className="loading loading-spinner" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="size-4" />
                        Export CSV
                      </>
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={exportSheetsOnOpen}
                    className="cursor-pointer"
                  >
                    <Sheet className="size-4" />
                    Export to Google Sheets
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuItem
                onClick={() =>
                  window.open(`${router.basePath}/${listingPath}`, '_blank')
                }
                className="cursor-pointer"
              >
                <ExternalLink className="size-4" />
                View Listing
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => copyToClipboard(getListingUrl())}
                className="cursor-pointer"
              >
                <CopyIcon className="size-4" />
                Copy Link
              </DropdownMenuItem>

              {!!(
                (user?.role === 'GOD' && bounty?.type !== 'grant') ||
                (bounty?.isPublished &&
                  !pastDeadline &&
                  bounty.type !== 'grant')
              ) &&
                !isHackathonPage &&
                getEditText() && (
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link
                      href={
                        bounty
                          ? `/dashboard/${isHackathonPage ? 'hackathon' : 'listings'}/${bounty.slug}/edit/`
                          : ''
                      }
                    >
                      <Pencil className="size-4" />
                      {getEditText()}
                    </Link>
                  </DropdownMenuItem>
                )}
            </DropdownMenuContent>
          </DropdownMenu>
          <StatusPill
            className="mr-6 ml-2 w-fit text-[0.8rem]"
            color={getColorStyles(bountyStatus).color}
            backgroundColor={getColorStyles(bountyStatus).bgColor}
            borderColor={getColorStyles(bountyStatus).borderColor}
          >
            {bountyStatus}
          </StatusPill>
          <BoostButton listing={bounty!} />

          <div className="ml-4 -translate-y-2.5">
            <AiReviewProjectApplicationsModal
              listing={bounty}
              applications={submissions}
            />
          </div>
          <div className="ml-4 -translate-y-2.5">
            <AiReviewBountiesSubmissionsModal
              listing={bounty}
              submissions={submissions}
            />
          </div>
        </div>
      </div>
      {!isProject && !bounty?.isWinnersAnnounced && (
        <div className="flex flex-col items-end">
          {activeTab === 'submissions' && (
            <>
              <Tooltip
                content={
                  <>
                    You cannot change the winners once the results are
                    published!
                    <TooltipArrow />
                  </>
                }
                disabled={!bounty?.isWinnersAnnounced}
                contentProps={{ sideOffset: 5 }}
              >
                <ShinyButton
                  disabled={
                    !afterAnnounceDate ||
                    isHackathonPage ||
                    remainings?.podiums !== 0 ||
                    (remainings?.bonus > 0 &&
                      submissions.filter((s) => !s.isWinner).length > 0)
                  }
                  onClick={onWinnersAnnounceOpen}
                  animate={true}
                  classNames={{
                    button: 'w-52 h-11',
                  }}
                >
                  <Check className="size-4" />
                  Announce Winners
                </ShinyButton>
              </Tooltip>
              {showWarning && (
                <div className="my-2 flex w-52">
                  <p className="text-xxs text-red-400">
                    There aren&apos;t enough eligible{' '}
                    {bounty?.type === 'project'
                      ? 'applications'
                      : 'submissions'}
                    .{' '}
                    <a
                      href={PDTG}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-purple underline"
                    >
                      Reach out
                    </a>{' '}
                    to update your listing.
                  </p>
                </div>
              )}
              {!!remainings &&
                !isProject &&
                !bounty?.isWinnersAnnounced &&
                !isHackathonPage && (
                  <div className="flex w-full py-1 text-xs">
                    {!!(remainings.bonus > 0 || remainings.podiums > 0) ? (
                      <p className="flex w-full items-center justify-center rounded-md bg-red-100 px-2 py-1 text-[#f55151]">
                        <AlertTriangle className="mr-1 inline-block h-3 w-3" />
                        {remainings.podiums > 0 && (
                          <>
                            {remainings.podiums}{' '}
                            {remainings.podiums === 1
                              ? 'Winner'
                              : 'Winners'}{' '}
                          </>
                        )}
                        {remainings.bonus > 0 && (
                          <>
                            {remainings.bonus}{' '}
                            {remainings.bonus === 1 ? 'Bonus' : 'Bonus'}{' '}
                          </>
                        )}
                        Remaining
                      </p>
                    ) : (
                      <></>
                    )}
                  </div>
                )}
            </>
          )}
        </div>
      )}

      {isProject && !bounty?.isWinnersAnnounced && bounty?.isPublished && (
        <div className="flex flex-row-reverse items-center gap-8">
          <p className="text-slate-800">
            {`Didn't find a suitable candidate? `}
            <span
              className="cursor-pointer text-blue-500 underline"
              onClick={unpublishOnOpen}
            >
              Click here
            </span>
          </p>
        </div>
      )}

      {bounty?.isWinnersAnnounced &&
        activeTab === 'submissions' &&
        !bounty?.isFndnPaying &&
        bountyStatus !== 'Completed' && (
          <ShinyButton
            animate={true}
            classNames={{
              button: 'h-11 w-48',
            }}
            onClick={() => {
              router.push(
                `/dashboard/listings/${bounty?.slug}/submissions?tab=payments`,
              );
            }}
          >
            <Check className="size-4" />
            Pay Winners
          </ShinyButton>
        )}

      {activeTab === 'payments' &&
        !bounty?.isFndnPaying &&
        bountyStatus !== 'Completed' && (
          <Button
            className={cn(
              'border-brand-purple text-brand-purple hover:bg-brand-purple shadow-md hover:text-white',
            )}
            onClick={handleVerifyPayment}
            variant="outline"
          >
            Paid Externally? Click here
          </Button>
        )}

      <VerifyPaymentModal
        listing={bounty}
        isOpen={verifyPaymentIsOpen}
        onClose={verifyPaymentOnClose}
      />

      <UnpublishModal
        unpublishIsOpen={unpublishIsOpen}
        unpublishOnClose={unpublishOnClose}
        listing={bounty}
      />

      <ExportSheetsModal
        isOpen={exportSheetsIsOpen}
        onClose={exportSheetsOnClose}
        apiEndpoint="/api/sponsor-dashboard/submission/export-sheets/"
        queryParams={{ listingId: bounty?.id }}
        entityName="submissions"
      />
    </div>
  );
};
