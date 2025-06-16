import { TooltipArrow } from '@radix-ui/react-tooltip';
import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import {
  AlertTriangle,
  ArrowRight,
  Copy,
  DollarSign,
  ExternalLink,
  Link2,
  Pencil,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { type Dispatch, type SetStateAction, useState } from 'react';
import { MdOutlineAccountBalanceWallet, MdOutlineMail } from 'react-icons/md';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { KycComponent } from '@/components/ui/KycComponent';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tooltip } from '@/components/ui/tooltip';
import { useClipboard } from '@/hooks/use-clipboard';
import type { SubmissionWithUser } from '@/interface/submission';
import { getSubmissionUrl } from '@/utils/bounty-urls';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { getURLSanitized } from '@/utils/getURLSanitized';
import { truncatePublicKey } from '@/utils/truncatePublicKey';
import { truncateString } from '@/utils/truncateString';

import type { Listing } from '@/features/listings/types';
import {
  Telegram,
  Twitter,
  Website,
} from '@/features/social/components/SocialIcons';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';
import TreasuryStatus from '@/features/treasury/components/TreasuryStatus';

import { treasuryProposalStatusQuery } from '../../../treasury/queries/treasuryProposalStatus';
import { selectedSubmissionAtom } from '../../atoms';
import { Details } from './Details';
import NearTreasuryPaymentModal from './Modals/NearTreasuryPaymentModal';
import { UpdatePaymentDateModal } from './Modals/UpdatePaymentDateModal';
import { SelectLabel } from './SelectLabel';
import { SelectWinner } from './SelectWinner';

interface Props {
  bounty: Listing | undefined;
  submissions: SubmissionWithUser[];
  usedPositions: number[];
  isHackathonPage?: boolean;
  onWinnersAnnounceOpen: () => void;
  remainings: { podiums: number; bonus: number } | null;
  setRemainings: Dispatch<
    SetStateAction<{ podiums: number; bonus: number } | null>
  >;
  isMultiSelectOn?: boolean;
  onVerifyPayment: () => void;
}

interface PaymentButtonProps {
  treasury?: {
    link: string;
    proposalId: number;
    dao: string;
  };
  proposalStatus?: string;
  isLoadingProposalStatus: boolean;
  onVerifyPayment: () => void;
  setIsNearTreasuryPaymentModalOpen: Dispatch<SetStateAction<boolean>>;
}

export const PaymentButton = ({
  treasury,
  proposalStatus,
  isLoadingProposalStatus,
  onVerifyPayment,
  setIsNearTreasuryPaymentModalOpen,
}: PaymentButtonProps) => {
  if (isLoadingProposalStatus) {
    return <></>;
  }

  if (proposalStatus === 'InProgress' || proposalStatus === 'Approved') {
    return (
      <Link
        href={getURLSanitized(treasury?.link || '')}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button
          variant="outline"
          className="ph-no-capture min-w-[120px] text-slate-500"
        >
          View Pending Request
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    );
  }

  return (
    <Popover>
      <PopoverTrigger>
        <Button className="ph-no-capture min-w-[120px] disabled:cursor-not-allowed">
          <DollarSign className="mr-2 h-4 w-4" />
          Complete Reward Payment
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="flex w-full max-w-md flex-col gap-2 p-2"
      >
        <Button
          onClick={() => onVerifyPayment()}
          variant="ghost"
          className="flex h-full w-full items-start rounded-sm px-4 py-3"
        >
          <Link2 className="mr-3 h-4 w-4" />
          <div className="flex flex-col text-left">
            <p>Add Payment Link</p>
            <p className="text-wrap text-xs text-muted-foreground">
              Pay the contributor using your preferred method, then paste the
              transaction link here.
            </p>
          </div>
        </Button>
        <Button
          onClick={() => setIsNearTreasuryPaymentModalOpen(true)}
          variant="ghost"
          className="flex h-full w-full items-start justify-start rounded-sm pb-3 pl-2 pr-4 pt-[10px]"
        >
          <Image
            src="/assets/NEARTreasuryLogo.svg"
            alt="Near Treasury Logo"
            width={24}
            height={24}
            className="mr-3"
          />
          <div className="flex flex-col text-left">
            <p>Pay with NEAR Treasury</p>
            <p className="text-wrap text-xs text-muted-foreground">
              Create a payment request through NEAR Treasury and approve it
              on-chain.
            </p>
          </div>
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export const SubmissionPanel = ({
  bounty,
  submissions,
  usedPositions,
  isHackathonPage,
  onWinnersAnnounceOpen,
  remainings,
  setRemainings,
  isMultiSelectOn,
  onVerifyPayment,
}: Props) => {
  const afterAnnounceDate =
    bounty?.type === 'hackathon'
      ? dayjs().isAfter(bounty?.Hackathon?.announceDate)
      : true;

  const isProject = bounty?.type === 'project';
  const isSponsorship = bounty?.type === 'sponsorship';
  const [selectedSubmission, setSelectedSubmission] = useAtom(
    selectedSubmissionAtom,
  );

  const { onCopy: onCopyEmail } = useClipboard(
    selectedSubmission?.user?.email || '',
  );

  const { onCopy: onCopyPublicKey } = useClipboard(
    selectedSubmission?.user?.publicKey || '',
  );

  const { onCopy: onCopySubmissionLink } = useClipboard(
    getSubmissionUrl(selectedSubmission, bounty),
  );

  const [isNearTreasuryPaymentModalOpen, setIsNearTreasuryPaymentModalOpen] =
    useState(false);

  const handleCopySubmissionLink = () => {
    if (selectedSubmission?.id) {
      onCopySubmissionLink();
      toast.success('Submission link copied', {
        duration: 1500,
      });
    }
  };
  const handleCopyEmail = () => {
    if (selectedSubmission?.user?.email) {
      onCopyEmail();
      toast.success('Email copied', {
        duration: 1500,
      });
    }
  };

  const handleCopyPublicKey = () => {
    if (selectedSubmission?.user?.publicKey) {
      onCopyPublicKey();
      toast.success('Wallet address copied', {
        duration: 1500,
      });
    }
  };
  const [isUpdatePaymentDateModalOpen, setIsUpdatePaymentDateModalOpen] =
    useState(false);

  const handleUpdatePaymentDate = () => {
    setIsUpdatePaymentDateModalOpen(true);
  };

  const treasury = selectedSubmission?.paymentDetails?.treasury;

  const { data: proposalStatus, isLoading: isLoadingProposalStatus } = useQuery(
    treasuryProposalStatusQuery(treasury?.dao, treasury?.proposalId ?? 0),
  );

  return (
    <>
      <div className="sticky top-[3rem] w-full">
        {submissions.length ? (
          <>
            <div className="rounded-t-xl border-b border-slate-200 bg-white py-1">
              <div className="flex w-full items-center justify-between px-4 pt-3">
                <div className="flex w-full items-center gap-2">
                  <EarnAvatar
                    className="h-10 w-10"
                    id={selectedSubmission?.user?.id}
                    avatar={selectedSubmission?.user?.photo || undefined}
                  />
                  <div>
                    <p className="w-full whitespace-nowrap font-medium text-slate-900">
                      {`${selectedSubmission?.user?.name}'s Submission`}
                    </p>
                    <Link
                      className="flex w-full items-center whitespace-nowrap text-xs font-medium text-black"
                      href={`/t/${selectedSubmission?.user?.username}`}
                    >
                      View Profile{' '}
                      <ArrowRight className="inline-block h-3 w-3" />
                    </Link>
                  </div>
                </div>
                <div
                  className={
                    'ph-no-capture flex w-full items-center justify-end gap-2'
                  }
                >
                  {isSponsorship && (
                    <Button
                      variant="ghost"
                      className="ph-no-capture text-slate-500 disabled:cursor-not-allowed"
                      onClick={handleCopySubmissionLink}
                    >
                      <Copy className="mr-1 h-4 w-4" />
                      Copy Submission Link
                    </Button>
                  )}
                  {selectedSubmission?.isWinner &&
                    selectedSubmission?.winnerPosition &&
                    !selectedSubmission?.isPaid &&
                    (bounty?.isWinnersAnnounced || isSponsorship) && (
                      <PaymentButton
                        treasury={treasury}
                        proposalStatus={proposalStatus}
                        isLoadingProposalStatus={isLoadingProposalStatus}
                        onVerifyPayment={onVerifyPayment}
                        setIsNearTreasuryPaymentModalOpen={
                          setIsNearTreasuryPaymentModalOpen
                        }
                      />
                    )}
                  {selectedSubmission?.status === 'Pending' &&
                    !selectedSubmission?.isPaid && (
                      <SelectLabel listingSlug={bounty?.slug!} />
                    )}
                  {selectedSubmission?.isWinner &&
                    selectedSubmission?.winnerPosition &&
                    selectedSubmission?.isPaid &&
                    selectedSubmission?.paymentDetails?.link && (
                      <Button
                        className="text-slate-500"
                        onClick={() => {
                          window.open(
                            getURLSanitized(
                              selectedSubmission?.paymentDetails?.link ?? '',
                            ),
                            '_blank',
                          );
                        }}
                        size="default"
                        variant="outline"
                      >
                        <ExternalLink className="mr-1 h-4 w-4" />
                        View Payment
                      </Button>
                    )}

                  {selectedSubmission?.isWinner &&
                    selectedSubmission?.winnerPosition &&
                    selectedSubmission?.isPaid &&
                    !selectedSubmission?.paymentDetails?.link && (
                      <Button
                        className="text-slate-500"
                        disabled
                        size="default"
                        variant="outline"
                      >
                        <p className="mr-2">Marked as paid</p>
                      </Button>
                    )}
                  {!bounty?.isWinnersAnnounced &&
                    selectedSubmission?.status === 'Pending' && (
                      <>
                        <SelectWinner
                          onWinnersAnnounceOpen={onWinnersAnnounceOpen}
                          isMultiSelectOn={!!isMultiSelectOn}
                          bounty={bounty}
                          usedPositions={usedPositions}
                          setRemainings={setRemainings}
                          submissions={submissions}
                          isHackathonPage={isHackathonPage}
                        />
                        {!isProject && !isSponsorship && (
                          <Tooltip
                            content={
                              <>
                                You cannot change the winners once the results
                                are published!
                                <TooltipArrow />
                              </>
                            }
                            disabled={!bounty?.isWinnersAnnounced}
                            contentProps={{ sideOffset: 5 }}
                          >
                            <Button
                              className={cn(
                                'ml-4',
                                'disabled:cursor-not-allowed disabled:bg-[#A1A1A1] disabled:hover:bg-[#A1A1A1]',
                              )}
                              disabled={
                                !afterAnnounceDate ||
                                isHackathonPage ||
                                remainings?.podiums !== 0 ||
                                remainings?.bonus !== 0
                              }
                              onClick={onWinnersAnnounceOpen}
                              variant="default"
                            >
                              Announce Winners
                            </Button>
                          </Tooltip>
                        )}
                      </>
                    )}
                </div>
              </div>
              <div className="ml-auto flex w-fit px-4 py-1 text-xs">
                {!!remainings && !isProject && !isSponsorship && (
                  <>
                    {!!(remainings.bonus > 0 || remainings.podiums > 0) ? (
                      <p className="flex items-center rounded-md bg-red-100 px-5 py-1 text-[#f55151]">
                        <AlertTriangle className="mr-1 inline-block h-3 w-3" />
                        {remainings.podiums > 0 && (
                          <>
                            {remainings.podiums}{' '}
                            {remainings.podiums === 1 ? 'Winner' : 'Winners'}{' '}
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
                      <p className="rounded-md bg-green-100 px-3 py-1 text-[#48CB6D]">
                        All winners selected
                      </p>
                    )}
                  </>
                )}
                <TreasuryStatus
                  treasury={treasury}
                  submissionId={selectedSubmission?.id ?? ''}
                  submissionIsPaid={selectedSubmission?.isPaid ?? false}
                  updateSubmission={() => {
                    setSelectedSubmission((prev) =>
                      prev && prev.id === selectedSubmission?.id
                        ? {
                            ...prev,
                            isPaid: true,
                            paymentDetails: {
                              link: prev.paymentDetails?.link,
                            },
                          }
                        : prev,
                    );
                  }}
                />
              </div>

              <div className="flex items-center gap-5 px-5 py-2">
                {selectedSubmission?.user?.email && (
                  <Tooltip
                    content={'Click to copy'}
                    contentProps={{ side: 'right' }}
                    triggerClassName="flex items-center hover:underline underline-offset-1"
                  >
                    <div
                      className="flex cursor-pointer items-center justify-start gap-1 text-sm text-slate-400 hover:text-slate-500"
                      onClick={handleCopyEmail}
                      role="button"
                      tabIndex={0}
                      aria-label={`Copy email: ${selectedSubmission.user.email}`}
                    >
                      <MdOutlineMail />
                      {truncateString(selectedSubmission.user.email, 36)}
                    </div>
                  </Tooltip>
                )}

                {selectedSubmission?.user?.publicKey && (
                  <>
                    <Tooltip
                      content={'Click to copy'}
                      contentProps={{ side: 'right' }}
                      triggerClassName="flex items-center hover:underline underline-offset-1"
                    >
                      <div
                        className="flex cursor-pointer items-center justify-start gap-1 whitespace-nowrap text-sm text-slate-400 hover:text-slate-500"
                        onClick={handleCopyPublicKey}
                        role="button"
                        tabIndex={0}
                        aria-label={`Copy public key: ${truncatePublicKey(selectedSubmission.user.publicKey, 20)}`}
                      >
                        <MdOutlineAccountBalanceWallet />
                        <p>
                          {truncatePublicKey(
                            selectedSubmission.user.publicKey,
                            20,
                          )}
                        </p>
                      </div>
                    </Tooltip>
                    <KycComponent
                      address={selectedSubmission?.user?.publicKey}
                      xs
                      listingSponsorId={bounty?.sponsorId}
                    />
                  </>
                )}
                <div className="flex gap-2">
                  <Telegram
                    className="h-[0.9rem] w-[0.9rem] text-slate-600"
                    link={selectedSubmission?.user?.telegram || ''}
                  />
                  <Twitter
                    className="h-[0.9rem] w-[0.9rem] text-slate-600"
                    link={selectedSubmission?.user?.twitter || ''}
                  />
                  <Website
                    className="h-[0.9rem] w-[0.9rem] text-slate-600"
                    link={selectedSubmission?.user?.website || ''}
                  />
                </div>
                {isProject && (
                  <p className="whitespace-nowrap text-sm text-slate-400">
                    $
                    {formatNumberWithSuffix(
                      selectedSubmission?.totalEarnings || 0,
                    )}{' '}
                    Earned
                  </p>
                )}
                {selectedSubmission?.isPaid &&
                  selectedSubmission?.paymentDate && (
                    <div className="flex items-center">
                      <p className="text-sm text-slate-400">
                        Paid on:{' '}
                        {dayjs(selectedSubmission.paymentDate).format(
                          'MMM D, YYYY',
                        )}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="p-0 text-xs text-slate-500"
                        onClick={handleUpdatePaymentDate}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
              </div>
            </div>
            <Details bounty={bounty} />
          </>
        ) : (
          <div className="p-3">
            <p className="text-xl font-medium text-slate-500">
              No submissions found
            </p>
            <p className="text-sm text-slate-400">
              Try a different search query
            </p>
          </div>
        )}
      </div>
      <UpdatePaymentDateModal
        isOpen={isUpdatePaymentDateModalOpen}
        onClose={() => setIsUpdatePaymentDateModalOpen(false)}
        submissionId={selectedSubmission?.id || ''}
        listingId={bounty?.id || ''}
        currentPaymentDate={selectedSubmission?.paymentDate}
        onSuccess={(date) => {
          setSelectedSubmission((prev) =>
            prev && prev.id === selectedSubmission?.id
              ? { ...prev, paymentDate: date }
              : prev,
          );
        }}
      />
      {selectedSubmission && (
        <NearTreasuryPaymentModal
          isOpen={isNearTreasuryPaymentModalOpen}
          onClose={() => setIsNearTreasuryPaymentModalOpen(false)}
          submissionId={selectedSubmission?.id || ''}
          onSuccess={(
            treasuryLink: string,
            proposalId: number,
            dao: string,
          ) => {
            setSelectedSubmission((prev) =>
              prev && prev.id === selectedSubmission?.id
                ? {
                    ...prev,
                    paymentDetails: {
                      treasury: { link: treasuryLink, proposalId, dao },
                    },
                  }
                : prev,
            );
          }}
        />
      )}
    </>
  );
};
