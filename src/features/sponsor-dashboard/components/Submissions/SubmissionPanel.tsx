import { SubmissionLabels } from '@prisma/client';
import { useAtom } from 'jotai';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { MdOutlineAccountBalanceWallet } from 'react-icons/md';

import { CopyButton } from '@/components/ui/copy-tooltip';
import type { SubmissionWithUser } from '@/interface/submission';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { truncatePublicKey } from '@/utils/truncatePublicKey';
import { truncateString } from '@/utils/truncateString';

import type { Listing } from '@/features/listings/types';
import {
  Telegram,
  Twitter,
  Website,
} from '@/features/social/components/SocialIcons';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { selectedSubmissionAtom } from '../../atoms';
import { Details } from './Details';
import { SelectLabel } from './SelectLabel';
import { SelectWinner } from './SelectWinner';
import { SpamButton } from './SpamButton';

interface Props {
  bounty: Listing | undefined;
  submissions: SubmissionWithUser[];
  usedPositions: number[];
  isHackathonPage?: boolean;
  onWinnersAnnounceOpen: () => void;
  isMultiSelectOn?: boolean;
}

export const SubmissionPanel = ({
  bounty,
  submissions,
  usedPositions,
  isHackathonPage,
  onWinnersAnnounceOpen,
  isMultiSelectOn,
}: Props) => {
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
                <div className="self-start">
                  {!isHackathonPage &&
                    selectedSubmission?.status === 'Pending' &&
                    !bounty?.isWinnersAnnounced && (
                      <SelectLabel listingSlug={bounty?.slug!} />
                    )}
                </div>
              </div>
              <div className="ph-no-capture flex w-full items-center justify-end gap-2">
                {!bounty?.isWinnersAnnounced &&
                  (selectedSubmission?.status === 'Pending' ||
                    selectedSubmission?.label === SubmissionLabels.Spam) && (
                    <SpamButton
                      listingSlug={bounty?.slug!}
                      isMultiSelectOn={!!isMultiSelectOn}
                    />
                  )}
                {!bounty?.isWinnersAnnounced && !isHackathonPage && (
                  <SelectWinner
                    onWinnersAnnounceOpen={onWinnersAnnounceOpen}
                    isMultiSelectOn={!!isMultiSelectOn}
                    bounty={bounty}
                    usedPositions={usedPositions}
                    isHackathonPage={isHackathonPage}
                  />
                )}
              </div>
            </div>
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
