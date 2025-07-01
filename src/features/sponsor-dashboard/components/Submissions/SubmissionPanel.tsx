import { TooltipArrow } from '@radix-ui/react-tooltip';
import { useAtom } from 'jotai';
import { AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import MdOutlineAccountBalanceWallet from '@/components/icons/MdOutlineAccountBalanceWallet';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-tooltip';
import { Tooltip } from '@/components/ui/tooltip';
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
  isMultiSelectOn?: boolean;
}

export const SubmissionPanel = ({
  bounty,
  submissions,
  usedPositions,
  isHackathonPage,
  onWinnersAnnounceOpen,
  remainings,
  isMultiSelectOn,
}: Props) => {
  const afterAnnounceDate =
    bounty?.type === 'hackathon'
      ? dayjs().isAfter(bounty?.Hackathon?.announceDate)
      : true;

  const isProject = bounty?.type === 'project';

  const [selectedSubmission] = useAtom(selectedSubmissionAtom);

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
                  <p className="w-full font-medium whitespace-nowrap text-slate-900">
                    {`${selectedSubmission?.user?.firstName}'s Submission`}
                  </p>
                  <Link
                    className="text-brand-purple flex w-full items-center text-xs font-medium whitespace-nowrap"
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
                  (bounty?.isWinnersAnnounced ? (
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
                {!isHackathonPage &&
                  selectedSubmission?.status === 'Pending' &&
                  !bounty?.isWinnersAnnounced && (
                    <SelectLabel listingSlug={bounty?.slug!} />
                  )}
                {selectedSubmission?.isWinner &&
                  selectedSubmission?.winnerPosition &&
                  selectedSubmission?.isPaid && (
                    <Button
                      className="mr-4 text-slate-600"
                      onClick={() => {
                        window.open(
                          `https://solscan.io/tx/${selectedSubmission?.paymentDetails?.txId}?cluster=${process.env.NEXT_PUBLIC_PAYMENT_CLUSTER}`,
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
                {!bounty?.isWinnersAnnounced && !isHackathonPage && (
                  <>
                    <SelectWinner
                      onWinnersAnnounceOpen={onWinnersAnnounceOpen}
                      isMultiSelectOn={!!isMultiSelectOn}
                      bounty={bounty}
                      usedPositions={usedPositions}
                      isHackathonPage={isHackathonPage}
                    />

                    {!isProject && (
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
                            (remainings?.bonus > 0 &&
                              submissions.filter((s) => !s.isWinner).length > 0)
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
            {!!remainings &&
              !isProject &&
              !bounty?.isWinnersAnnounced &&
              !isHackathonPage && (
                <div className="absolute right-0 ml-auto flex w-fit px-4 py-1 text-xs">
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
                <CopyButton
                  text={selectedSubmission.user.email}
                  className="gap-1 text-sm text-slate-400 underline-offset-1 hover:text-slate-500 hover:underline"
                  contentProps={{ side: 'right' }}
                >
                  {truncateString(selectedSubmission.user.email, 36)}
                </CopyButton>
              )}

              {selectedSubmission?.user?.walletAddress && (
                <CopyButton
                  className="gap-1 text-sm text-slate-400 underline-offset-1 hover:text-slate-500 hover:underline"
                  contentProps={{ side: 'right' }}
                  text={selectedSubmission.user.walletAddress}
                >
                  <MdOutlineAccountBalanceWallet />
                  <p>
                    {truncatePublicKey(
                      selectedSubmission.user.walletAddress || '',
                      3,
                    )}
                  </p>
                </CopyButton>
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
                <p className="text-sm whitespace-nowrap text-slate-400">
                  $
                  {formatNumberWithSuffix(
                    selectedSubmission?.totalEarnings || 0,
                  )}{' '}
                  Earned
                </p>
              )}
            </div>
          </div>
          <Details bounty={bounty} isHackathonPage={isHackathonPage} />
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
