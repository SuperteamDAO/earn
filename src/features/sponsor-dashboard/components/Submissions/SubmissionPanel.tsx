import { TooltipArrow } from '@radix-ui/react-tooltip';
import { useAtom } from 'jotai';
import { AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import React, { type Dispatch, type SetStateAction } from 'react';
import { MdOutlineAccountBalanceWallet, MdOutlineMail } from 'react-icons/md';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { useClipboard } from '@/hooks/use-clipboard';
import type { SubmissionWithUser } from '@/interface/submission';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dayjs';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { truncatePublicKey } from '@/utils/truncatePublicKey';
import { truncateString } from '@/utils/truncateString';

import type { Listing, Rewards } from '@/features/listings/types';
import {
  Telegram,
  Twitter,
  Website,
} from '@/features/social/components/SocialIcons';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { selectedSubmissionAtom } from '../../atoms';
import { Details } from './Details';
import { PayoutButton } from './PayoutButton';
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
}

export const SubmissionPanel = ({
  bounty,
  submissions,
  usedPositions,
  isHackathonPage,
  onWinnersAnnounceOpen,
  remainings,
  setRemainings,
  isMultiSelectOn,
}: Props) => {
  const afterAnnounceDate =
    bounty?.type === 'hackathon'
      ? dayjs().isAfter(bounty?.Hackathon?.announceDate)
      : true;

  const isProject = bounty?.type === 'project';
  const isSponsorship = bounty?.type === 'sponsorship';
  const [selectedSubmission] = useAtom(selectedSubmissionAtom);

  const { onCopy: onCopyEmail } = useClipboard(
    selectedSubmission?.user?.email || '',
  );

  const { onCopy: onCopyPublicKey } = useClipboard(
    selectedSubmission?.user?.publicKey || '',
  );

  const handleCopyEmail = () => {
    if (selectedSubmission?.user?.email) {
      onCopyEmail();
      toast.success('Email copied to clipboard', {
        duration: 1500,
      });
    }
  };

  const handleCopyPublicKey = () => {
    if (selectedSubmission?.user?.publicKey) {
      onCopyPublicKey();
      toast.success('Wallet address copied to clipboard', {
        duration: 1500,
      });
    }
  };

  return (
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
                    {`${selectedSubmission?.user?.firstName}'s Submission`}
                  </p>
                  <Link
                    className="flex w-full items-center whitespace-nowrap text-xs font-medium text-brand-purple"
                    href={`/t/${selectedSubmission?.user?.username}`}
                  >
                    View Profile <ArrowRight className="inline-block h-3 w-3" />
                  </Link>
                </div>
              </div>
              <div className="ph-no-capture flex w-full items-center justify-end gap-2">
                {selectedSubmission?.isWinner &&
                  selectedSubmission?.winnerPosition &&
                  !selectedSubmission?.isPaid &&
                  (bounty?.isWinnersAnnounced || isSponsorship ? (
                    <PayoutButton bounty={bounty} />
                  ) : (
                    <Tooltip
                      content={
                        !bounty?.isWinnersAnnounced ? (
                          <>
                            Please announce the winners before you paying out
                            the winners
                            <TooltipArrow />
                          </>
                        ) : null
                      }
                      contentProps={{ sideOffset: 5 }}
                    >
                      <Button
                        className="mr-4"
                        disabled={!bounty?.isWinnersAnnounced}
                        size="sm"
                        variant="default"
                      >
                        Pay {bounty?.token}{' '}
                        {!!bounty?.rewards &&
                          bounty?.rewards[
                            selectedSubmission?.winnerPosition as keyof Rewards
                          ]}
                      </Button>
                    </Tooltip>
                  ))}
                {<SelectLabel listingSlug={bounty?.slug!} />}
                {selectedSubmission?.isWinner &&
                  selectedSubmission?.winnerPosition &&
                  selectedSubmission?.isPaid && (
                    <Button
                      className="mr-4 text-slate-600"
                      onClick={() => {
                        window.open(
                          `https://nearblocks.io/txns/${selectedSubmission?.paymentDetails?.txId}`,
                          '_blank',
                        );
                      }}
                      size="default"
                      variant="ghost"
                    >
                      View Payment Tx
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                {!bounty?.isWinnersAnnounced && (
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
                            You cannot change the winners once the results are
                            published!
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
            {!!remainings && !isProject && !isSponsorship && (
              <div className="ml-auto flex w-fit px-4 py-1 text-xs">
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
              </div>
            )}

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
                    aria-label={`Copy public key: ${truncatePublicKey(selectedSubmission.user.publicKey, 3)}`}
                  >
                    <MdOutlineAccountBalanceWallet />
                    <p>
                      {truncatePublicKey(selectedSubmission.user.publicKey, 3)}
                    </p>
                  </div>
                </Tooltip>
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
            </div>
          </div>
          <Details bounty={bounty} />
        </>
      ) : (
        <div className="p-3">
          <p className="text-xl font-medium text-slate-500">
            No submissions found
          </p>
          <p className="text-sm text-slate-400">Try a different search query</p>
        </div>
      )}
    </div>
  );
};
