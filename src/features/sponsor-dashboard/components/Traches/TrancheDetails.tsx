import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { ArrowRight, Check, X } from 'lucide-react';
import Link from 'next/link';

import MdOutlineAccountBalanceWallet from '@/components/icons/MdOutlineAccountBalanceWallet';
import MdOutlineMail from '@/components/icons/MdOutlineMail';
import { VerifiedBadge } from '@/components/shared/VerifiedBadge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-tooltip';
import { CircularProgress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getTokenIcon } from '@/constants/tokenList';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { truncatePublicKey } from '@/utils/truncatePublicKey';
import { truncateString } from '@/utils/truncateString';

import { type Grant } from '@/features/grants/types';
import { isSTGrant, ST_GRANT_COPY } from '@/features/grants/utils/stGrant';
import {
  Telegram,
  Twitter,
  Website,
} from '@/features/social/components/SocialIcons';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { selectedGrantTrancheAtom } from '../../atoms';
import { type GrantTrancheWithApplication } from '../../queries/tranches';
import { ImageGallery } from '../ImageGallery';
import { InfoBox } from '../InfoBox';

interface Props {
  grant: Grant | undefined;
  tranches: GrantTrancheWithApplication[] | undefined;
  isLoading?: boolean;
  approveOnOpen: () => void;
  rejectedOnOpen: () => void;
}
export const TrancheDetails = ({
  grant,
  tranches,
  isLoading,
  approveOnOpen,
  rejectedOnOpen,
}: Props) => {
  const selectedTranche = useAtomValue(selectedGrantTrancheAtom);
  const isPending = selectedTranche?.status === 'Pending';
  const isApproved = selectedTranche?.status === 'Approved';
  const isRejected = selectedTranche?.status === 'Rejected';
  const isST = isSTGrant(grant);

  const tokenIcon = getTokenIcon(grant?.token ?? '');

  const formattedCreatedAt = dayjs(selectedTranche?.createdAt).format(
    'DD MMM YYYY',
  );

  const formattedDecidedAt = dayjs(
    selectedTranche?.GrantApplication?.decidedAt,
  ).format('DD MMM YYYY');

  const totalPaid = selectedTranche?.GrantApplication?.totalPaid || 0;
  const approvedAmount = selectedTranche?.GrantApplication?.approvedAmount || 0;

  const paidPercentage = (totalPaid / approvedAmount) * 100;

  return (
    <div className="h-full w-full rounded-r-xl bg-white">
      {tranches?.length ? (
        <>
          <div className="sticky top-[3rem] rounded-t-xl border-b border-slate-200 bg-white py-1">
            <div className="flex w-full items-center justify-between px-4 py-2">
              <div className="flex w-full items-center gap-2">
                <EarnAvatar
                  className="h-10 w-10"
                  id={selectedTranche?.GrantApplication?.user?.id}
                  avatar={
                    selectedTranche?.GrantApplication?.user?.photo || undefined
                  }
                />

                <div>
                  <div className="flex items-center gap-2">
                    <p className="w-full text-base font-medium whitespace-nowrap text-slate-900">
                      {`${selectedTranche?.GrantApplication?.user?.firstName}`}
                      ’s Application
                    </p>
                    <p className="flex items-center gap-1 text-xs font-semibold whitespace-nowrap text-green-600">
                      <VerifiedBadge className="text-green-600" />
                      KYC
                    </p>
                  </div>

                  <Link
                    href={`/earn/t/${selectedTranche?.GrantApplication?.user?.username}`}
                    className="text-brand-purple flex w-full items-center gap-1 text-xs font-medium whitespace-nowrap"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    View Profile
                    <ArrowRight className="mb-0.5 h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="ph-no-capture flex w-full items-center justify-end gap-2">
                {isPending && (
                  <>
                    <Button
                      className="rounded-lg border border-emerald-500 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={approveOnOpen}
                    >
                      <div className="rounded-full bg-emerald-600 p-0.5">
                        <Check className="size-1 text-white" />
                      </div>
                      Approve
                    </Button>

                    <Button
                      className="rounded-lg border border-red-500 bg-red-50 text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={rejectedOnOpen}
                    >
                      <div className="rounded-full bg-red-600 p-0.5">
                        <X className="size-1 text-white" />
                      </div>
                      Reject
                    </Button>
                  </>
                )}
                {isApproved && (
                  <>
                    <Button
                      className="rounded-lg border border-emerald-500 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-100"
                      disabled={true}
                    >
                      <div className="rounded-full bg-emerald-600 p-0.5">
                        <Check className="size-1 text-white" />
                      </div>
                      Approved
                    </Button>
                  </>
                )}
                {isRejected && (
                  <>
                    <Button
                      className="rounded-lg border border-red-500 bg-red-50 text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-100"
                      disabled={true}
                    >
                      <div className="rounded-full bg-red-600 p-0.5">
                        <X className="size-1 text-white" />
                      </div>
                      Rejected
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 px-4 py-2">
              <div className="flex items-center">
                <p className="mr-3 text-sm font-semibold whitespace-nowrap text-slate-400">
                  TOTAL GRANT
                </p>
                <img
                  className="mr-0.5 h-4 w-4 rounded-full"
                  src={tokenIcon}
                  alt="token"
                />

                <p className="text-sm font-semibold whitespace-nowrap text-slate-600">
                  {`${selectedTranche?.GrantApplication?.approvedAmount?.toLocaleString('en-us')}`}
                  <span className="ml-0.5 text-slate-400">{grant?.token}</span>
                </p>

                <div className="mx-3 flex">
                  <CircularProgress
                    className="h-5 w-5 rounded-full bg-gray-200"
                    value={paidPercentage}
                  />

                  <p className="ml-1 text-sm font-medium whitespace-nowrap text-slate-600">
                    {paidPercentage.toFixed(0)}%{' '}
                    <span className="text-slate-400">Paid</span>
                  </p>
                </div>
              </div>
              {selectedTranche?.GrantApplication?.user?.email && (
                <CopyButton
                  text={selectedTranche?.GrantApplication?.user?.email || ''}
                  className="gap-1 text-sm text-slate-400 underline-offset-1 hover:text-slate-500 hover:underline"
                  contentProps={{ side: 'right' }}
                >
                  <MdOutlineMail />
                  {truncateString(
                    selectedTranche?.GrantApplication?.user?.email,
                    36,
                  )}
                </CopyButton>
              )}
              {selectedTranche?.walletAddress && (
                <CopyButton
                  text={selectedTranche?.walletAddress || ''}
                  className="gap-1 text-sm text-slate-400 underline-offset-1 hover:text-slate-500 hover:underline"
                  contentProps={{ side: 'right' }}
                >
                  <MdOutlineAccountBalanceWallet />
                  <p>
                    {truncatePublicKey(selectedTranche?.walletAddress || '', 3)}
                  </p>
                </CopyButton>
              )}

              <div className="flex gap-2">
                <Telegram
                  className="h-[0.9rem] w-[0.9rem] text-slate-600"
                  link={selectedTranche?.GrantApplication?.user?.telegram || ''}
                />

                <Twitter
                  className="h-[0.9rem] w-[0.9rem] text-slate-600"
                  link={selectedTranche?.GrantApplication?.user?.twitter || ''}
                />

                <Website
                  className="h-[0.9rem] w-[0.9rem] text-slate-600"
                  link={selectedTranche?.GrantApplication?.user?.website || ''}
                />
              </div>
              <p className="text-sm whitespace-nowrap text-slate-400">
                ${formatNumberWithSuffix(selectedTranche?.totalEarnings || 0)}{' '}
                Earned
              </p>
            </div>
          </div>

          <div className="flex h-[39.3rem] w-full">
            <ScrollArea
              className="flex w-full flex-1 flex-col overflow-y-auto border-r border-slate-200 p-4"
              type="auto"
            >
              {selectedTranche?.trancheNumber === 1 && (
                <div className="mb-4">
                  <p className="mb-1 text-xs text-slate-500">
                    Note: Since this is the first tranche, it was added here
                    automatically upon user&apos;s successful KYC. First
                    tranches do not require explicit approval from the leads.
                  </p>
                </div>
              )}

              {(selectedTranche?.status === 'Approved' ||
                selectedTranche?.status === 'Paid') && (
                <div className="mb-4">
                  <p className="mb-1 text-xs font-semibold text-slate-400 uppercase">
                    APPROVED TRANCHE AMOUNT
                  </p>
                  <div className="flex items-center gap-0.5">
                    <img
                      className="mr-0.5 h-4 w-4 rounded-full"
                      src={tokenIcon}
                      alt="token"
                    />

                    <p className="text-sm font-semibold whitespace-nowrap text-slate-600">
                      {`${selectedTranche?.approvedAmount?.toLocaleString('en-us')}`}
                      <span className="ml-0.5 text-slate-400">
                        {grant?.token}
                      </span>
                    </p>
                  </div>
                </div>
              )}
              {selectedTranche?.trancheNumber !== 1 && (
                <div className="mb-4">
                  <p className="mb-1 text-xs font-semibold text-slate-400 uppercase">
                    TRANCHE ASK
                  </p>
                  <div className="flex items-center gap-0.5">
                    <img
                      className="mr-0.5 h-4 w-4 rounded-full"
                      src={tokenIcon}
                      alt="token"
                    />

                    <p className="text-sm font-semibold whitespace-nowrap text-slate-600">
                      {`${selectedTranche?.ask?.toLocaleString('en-us')}`}
                      <span className="ml-0.5 text-slate-400">
                        {grant?.token}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              <InfoBox
                label="Tranche Request Date"
                content={formattedCreatedAt}
              />

              {!isST && (
                <InfoBox
                  label="KPIS AND MILESTONES"
                  content={selectedTranche?.GrantApplication?.kpi}
                  isHtml
                />
              )}

              <InfoBox
                label={
                  isST
                    ? ST_GRANT_COPY.tranche.projectUpdate.label
                    : 'Project Updates'
                }
                content={selectedTranche?.update}
                isHtml
              />

              {isST && (
                <>
                  <ImageGallery
                    label={ST_GRANT_COPY.tranche.eventPictures.label}
                    images={selectedTranche?.eventPictures as string[] | null}
                  />

                  <ImageGallery
                    label={ST_GRANT_COPY.tranche.eventReceipts.label}
                    images={selectedTranche?.eventReceipts as string[] | null}
                  />

                  {selectedTranche?.attendeeCount !== null &&
                    selectedTranche?.attendeeCount !== undefined && (
                      <InfoBox
                        label={ST_GRANT_COPY.tranche.attendeeCount.label}
                        content={String(selectedTranche.attendeeCount)}
                      />
                    )}

                  {selectedTranche?.socialPost && (
                    <InfoBox
                      label={ST_GRANT_COPY.tranche.socialPost.label}
                      content={selectedTranche.socialPost}
                    />
                  )}
                </>
              )}

              <InfoBox
                label={
                  isST ? ST_GRANT_COPY.tranche.helpWanted.label : 'Help Wanted'
                }
                content={selectedTranche?.helpWanted}
                isHtml
              />

              <InfoBox
                label="Grant Approval Date"
                content={formattedDecidedAt}
              />

              <InfoBox
                label="Twitter"
                content={selectedTranche?.GrantApplication?.twitter}
              />

              {Array.isArray(selectedTranche?.GrantApplication?.answers) &&
                selectedTranche?.GrantApplication?.answers.map(
                  (answer: any, answerIndex: number) => (
                    <InfoBox
                      key={answerIndex}
                      label={answer.question}
                      content={answer.answer}
                      isHtml
                    />
                  ),
                )}
            </ScrollArea>
          </div>
        </>
      ) : isLoading ? (
        <div className="flex h-full items-center justify-center p-3">
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      ) : (
        <div className="p-3">
          <p className="text-xl font-medium text-slate-500">
            No applications found
          </p>
          <p className="text-sm text-slate-400">Try a different search query</p>
        </div>
      )}
    </div>
  );
};
