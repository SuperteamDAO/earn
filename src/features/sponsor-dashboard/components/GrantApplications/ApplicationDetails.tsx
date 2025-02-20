import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useAtom } from 'jotai';
import { ArrowRight, Check, Copy, X } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { MdOutlineAccountBalanceWallet, MdOutlineMail } from 'react-icons/md';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { CircularProgress } from '@/components/ui/progress';
import { Tooltip } from '@/components/ui/tooltip';
import { tokenList } from '@/constants/tokenList';
import { useClipboard } from '@/hooks/use-clipboard';
import { cn } from '@/utils/cn';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { truncatePublicKey } from '@/utils/truncatePublicKey';
import { truncateString } from '@/utils/truncateString';

import { type Grant } from '@/features/grants/types';
import {
  Telegram,
  Twitter,
  Website,
} from '@/features/social/components/SocialIcons';
import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import { selectedGrantApplicationAtom } from '../../atoms';
import { type GrantApplicationsReturn } from '../../queries/applications';
import { type GrantApplicationWithUser } from '../../types';
import { InfoBox } from '../InfoBox';
import { MarkCompleted } from './MarkCompleted';
import { Notes } from './Notes';
import { RecordPaymentButton } from './RecordPaymentButton';
import { SelectLabel } from './SelectLabel';

interface Props {
  grant: Grant | undefined;
  applications: GrantApplicationWithUser[] | undefined;
  isMultiSelectOn: boolean;
  params: {
    searchText: string;
    length: number;
    skip: number;
  };
  approveOnOpen: () => void;
  rejectedOnOpen: () => void;
}
export const ApplicationDetails = ({
  grant,
  applications,
  isMultiSelectOn,
  params,
  approveOnOpen,
  rejectedOnOpen,
}: Props) => {
  const [selectedApplication, setSelectedApplication] = useAtom(
    selectedGrantApplicationAtom,
  );
  const isPending = selectedApplication?.applicationStatus === 'Pending';
  const isApproved = selectedApplication?.applicationStatus === 'Approved';
  const isRejected = selectedApplication?.applicationStatus === 'Rejected';
  const isCompleted = selectedApplication?.applicationStatus === 'Completed';

  const isNativeAndNonST = !grant?.airtableId && grant?.isNative;

  const queryClient = useQueryClient();

  const tokenIcon = tokenList.find(
    (ele) => ele.tokenSymbol === grant?.token,
  )?.icon;

  const formattedCreatedAt = dayjs(selectedApplication?.createdAt).format(
    'DD MMM YYYY',
  );

  const updateApplicationState = (
    updatedApplication: GrantApplicationWithUser,
  ) => {
    setSelectedApplication(updatedApplication);

    queryClient.setQueryData<GrantApplicationsReturn>(
      ['sponsor-applications', grant?.slug, params],
      (oldData) => {
        if (!oldData) return oldData;
        const data = oldData?.data.map((application) =>
          application.id === updatedApplication.id
            ? updatedApplication
            : application,
        );
        return {
          ...oldData,
          data,
        };
      },
    );
  };

  const { onCopy: onCopyEmail } = useClipboard(
    selectedApplication?.user?.email || '',
  );

  const { onCopy: onCopyPublicKey } = useClipboard(
    selectedApplication?.walletAddress || '',
  );

  const handleCopyEmail = () => {
    if (selectedApplication?.user?.email) {
      onCopyEmail();
      toast.success('Email copied to clipboard', {
        duration: 1500,
      });
    }
  };

  const handleCopyPublicKey = () => {
    if (selectedApplication?.walletAddress) {
      onCopyPublicKey();
      toast.success('Wallet address copied to clipboard', {
        duration: 1500,
      });
    }
  };

  return (
    <div className="w-full rounded-r-xl bg-white">
      {applications?.length ? (
        <>
          <div className="sticky top-[3rem] rounded-t-xl border-b border-slate-200 bg-white py-1">
            <div className="flex w-full items-center justify-between px-4 py-2">
              <div className="flex w-full items-center gap-2">
                <EarnAvatar
                  className="h-10 w-10"
                  id={selectedApplication?.user?.id}
                  avatar={selectedApplication?.user?.photo || undefined}
                />
                <div>
                  <p className="w-full text-base font-medium whitespace-nowrap text-slate-900">
                    {`${selectedApplication?.user?.firstName}`}
                  </p>
                  <Link
                    href={`/t/${selectedApplication?.user?.username}`}
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
                {<SelectLabel grantSlug={grant?.slug!} />}
                {isPending && (
                  <>
                    <Button
                      className={cn(
                        'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
                        isMultiSelectOn && 'cursor-not-allowed opacity-50',
                      )}
                      disabled={isMultiSelectOn}
                      onClick={approveOnOpen}
                      variant="ghost"
                    >
                      <div className="mr-2 flex items-center">
                        <div className="rounded-full bg-emerald-600 p-[5px]">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      </div>
                      Approve
                    </Button>

                    <Button
                      className={cn(
                        'bg-rose-50 text-rose-600 hover:bg-rose-100',
                        isMultiSelectOn && 'cursor-not-allowed opacity-50',
                      )}
                      disabled={isMultiSelectOn}
                      onClick={rejectedOnOpen}
                      variant="ghost"
                    >
                      <div className="mr-2 flex items-center">
                        <div className="rounded-full bg-rose-600 p-[5px]">
                          <X className="h-2 w-2 text-white" />
                        </div>
                      </div>
                      Reject
                    </Button>
                  </>
                )}
                {isCompleted && (
                  <Button
                    className="pointer-events-none bg-blue-100 text-blue-600 disabled:opacity-100"
                    disabled={true}
                    variant="ghost"
                  >
                    <div className="flex items-center">
                      <div className="rounded-full bg-blue-600 p-[5px]">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                    </div>
                    Completed
                  </Button>
                )}
                {isApproved && (
                  <>
                    <MarkCompleted
                      isCompleted={isCompleted}
                      applicationId={selectedApplication.id}
                      onMarkCompleted={updateApplicationState}
                    />
                    {isNativeAndNonST &&
                      selectedApplication.totalPaid !==
                        selectedApplication.approvedAmount && (
                        <RecordPaymentButton
                          applicationId={selectedApplication.id}
                          approvedAmount={selectedApplication.approvedAmount}
                          totalPaid={selectedApplication.totalPaid}
                          token={grant.token || 'USDC'}
                          onPaymentRecorded={updateApplicationState}
                        />
                      )}
                    <Button
                      className="pointer-events-none bg-emerald-50 text-emerald-600 disabled:opacity-100"
                      disabled={true}
                      variant="ghost"
                    >
                      <div className="flex items-center">
                        <div className="rounded-full bg-emerald-600 p-[5px]">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      </div>
                      Approved
                    </Button>
                  </>
                )}
                {isRejected && (
                  <>
                    <Button
                      className="pointer-events-none bg-rose-50 text-rose-600 disabled:opacity-100"
                      disabled={true}
                      variant="ghost"
                    >
                      <div className="flex items-center">
                        <div className="rounded-full bg-rose-600 p-[5px]">
                          <X className="h-2 w-2 text-white" />
                        </div>
                      </div>
                      Rejected
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 px-4 py-2">
              {isApproved && (
                <div className="flex items-center">
                  <p className="mr-3 text-sm font-semibold whitespace-nowrap text-slate-400">
                    APPROVED
                  </p>
                  <img
                    className="mr-0.5 h-4 w-4 rounded-full"
                    src={tokenIcon}
                    alt="token"
                  />
                  <p className="text-sm font-semibold whitespace-nowrap text-slate-600">
                    {`${selectedApplication?.approvedAmount?.toLocaleString('en-us')}`}
                    <span className="ml-0.5 text-slate-400">
                      {grant?.token}
                    </span>
                  </p>
                  {isApproved && (
                    <div className="mx-3 flex">
                      <CircularProgress
                        className="h-5 w-5 rounded-full bg-gray-200"
                        value={Number(
                          (
                            (selectedApplication.totalPaid /
                              selectedApplication.approvedAmount) *
                            100
                          ).toFixed(2),
                        )}
                      />
                      <p className="ml-1 text-sm font-medium whitespace-nowrap text-slate-600">
                        {Number(
                          (
                            (selectedApplication.totalPaid /
                              selectedApplication.approvedAmount) *
                            100
                          ).toFixed(2),
                        )}
                        % <span className="text-slate-400">Paid</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
              {selectedApplication?.user?.email && (
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
                    aria-label={`Copy email: ${selectedApplication.user.email}`}
                  >
                    <MdOutlineMail />
                    {truncateString(selectedApplication.user.email, 36)}
                  </div>
                </Tooltip>
              )}
              {selectedApplication?.user.publicKey && (
                <Tooltip
                  content={'Click to copy'}
                  contentProps={{ side: 'right' }}
                  triggerClassName="flex items-center hover:underline underline-offset-1"
                >
                  <div
                    className="flex cursor-pointer items-center justify-start gap-1 text-sm whitespace-nowrap text-slate-400 hover:text-slate-500"
                    onClick={handleCopyPublicKey}
                    role="button"
                    tabIndex={0}
                    aria-label={`Copy public key: ${truncatePublicKey(selectedApplication.user.publicKey || '', 3)}`}
                  >
                    <MdOutlineAccountBalanceWallet />s
                    <p>
                      {truncatePublicKey(selectedApplication.user.publicKey, 3)}
                    </p>
                  </div>
                </Tooltip>
              )}

              <div className="flex gap-2">
                <Telegram
                  className="h-[0.9rem] w-[0.9rem] text-slate-600"
                  link={selectedApplication?.user?.telegram || ''}
                />
                <Twitter
                  className="h-[0.9rem] w-[0.9rem] text-slate-600"
                  link={selectedApplication?.user?.twitter || ''}
                />
                <Website
                  className="h-[0.9rem] w-[0.9rem] text-slate-600"
                  link={selectedApplication?.user?.website || ''}
                />
              </div>
              <p className="text-sm whitespace-nowrap text-slate-400">
                $
                {formatNumberWithSuffix(
                  selectedApplication?.totalEarnings || 0,
                )}{' '}
                Earned
              </p>
            </div>
          </div>

          <div className="flex h-[67.15rem] w-full">
            <div className="scrollbar-thumb-rounded-full scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300 flex w-full flex-1 flex-col overflow-y-auto border-r border-slate-200 p-4">
              <div className="mb-4">
                <p className="mb-1 text-xs font-semibold text-slate-400 uppercase">
                  ASK
                </p>
                <div className="flex items-center gap-0.5">
                  <img
                    className="mr-0.5 h-4 w-4 rounded-full"
                    src={tokenIcon}
                    alt="token"
                  />
                  <p className="text-sm font-semibold whitespace-nowrap text-slate-600">
                    {`${selectedApplication?.ask?.toLocaleString('en-us')}`}
                    <span className="ml-0.5 text-slate-400">
                      {grant?.token}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <div className="mb-1 text-xs font-semibold text-slate-400 uppercase">
                  APPLICATION DATE
                </div>
                <p className="text-sm font-medium whitespace-nowrap text-slate-600">
                  {formattedCreatedAt}
                </p>
              </div>

              <div className="mb-4">
                <p className="mt-1 text-xs font-semibold text-slate-400 uppercase">
                  Wallet Address
                </p>
                <div
                  className="flex cursor-pointer items-center gap-1 text-sm font-medium whitespace-nowrap text-slate-600"
                  onClick={handleCopyPublicKey}
                >
                  {selectedApplication?.walletAddress}
                  <Copy
                    className="h-4 w-4 text-slate-400"
                    onClick={handleCopyPublicKey}
                  />
                </div>
              </div>

              <InfoBox
                label="Project Title"
                content={selectedApplication?.projectTitle}
              />
              <InfoBox
                label="One-Liner Description"
                content={selectedApplication?.projectOneLiner}
              />
              <InfoBox
                label="Project Details"
                content={selectedApplication?.projectDetails}
                isHtml
              />
              <InfoBox label="Twitter" content={selectedApplication?.twitter} />
              <InfoBox
                label="Deadline"
                content={selectedApplication?.projectTimeline}
              />
              <InfoBox
                label="Proof of Work"
                content={selectedApplication?.proofOfWork}
                isHtml
              />
              <InfoBox
                label="Goals and Milestones"
                content={selectedApplication?.milestones}
                isHtml
              />
              <InfoBox
                label="Primary Key Performance Indicator"
                content={selectedApplication?.kpi}
                isHtml
              />
              {Array.isArray(selectedApplication?.answers) &&
                selectedApplication.answers.map(
                  (answer: any, answerIndex: number) => (
                    <InfoBox
                      key={answerIndex}
                      label={answer.question}
                      content={answer.answer}
                      isHtml
                    />
                  ),
                )}
            </div>
            <div className="w-1/4 p-4">
              <Notes slug={grant?.slug} />
            </div>
          </div>
        </>
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
