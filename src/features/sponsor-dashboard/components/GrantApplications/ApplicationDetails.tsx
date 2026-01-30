import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useAtom } from 'jotai';
import { ArrowRight, Check, Copy, X } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import MdOutlineAccountBalanceWallet from '@/components/icons/MdOutlineAccountBalanceWallet';
import MdOutlineMail from '@/components/icons/MdOutlineMail';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-tooltip';
import { CircularProgress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip } from '@/components/ui/tooltip';
import { Superteams } from '@/constants/Superteam';
import { getTokenIcon } from '@/constants/tokenList';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { truncatePublicKey } from '@/utils/truncatePublicKey';
import { truncateString } from '@/utils/truncateString';

import { type Grant } from '@/features/grants/types';
import { isSTGrant, ST_GRANT_COPY } from '@/features/grants/utils/stGrant';
import {
  GitHub,
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
import { SpamButton } from './SpamButton';

interface Props {
  grant: Grant | undefined;
  applications: GrantApplicationWithUser[] | undefined;
  isMultiSelectOn: boolean;
  approveOnOpen: () => void;
  rejectedOnOpen: () => void;
  isLoading?: boolean;
}
export const ApplicationDetails = ({
  grant,
  applications,
  isMultiSelectOn,
  approveOnOpen,
  rejectedOnOpen,
  isLoading,
}: Props) => {
  const [selectedApplication, setSelectedApplication] = useAtom(
    selectedGrantApplicationAtom,
  );
  const isPending = selectedApplication?.applicationStatus === 'Pending';
  const isApproved = selectedApplication?.applicationStatus === 'Approved';
  const isRejected = selectedApplication?.applicationStatus === 'Rejected';
  const isCompleted = selectedApplication?.applicationStatus === 'Completed';

  const isNativeAndNonST = !grant?.airtableId && grant?.isNative;
  const isST = isSTGrant(grant);

  const queryClient = useQueryClient();

  const tokenIcon = getTokenIcon(grant?.token ?? '');

  const formattedCreatedAt = dayjs(selectedApplication?.createdAt).format(
    'DD MMM YYYY',
  );

  const updateApplicationState = (
    updatedApplication: GrantApplicationWithUser,
  ) => {
    setSelectedApplication(updatedApplication);

    queryClient.setQueryData<GrantApplicationsReturn>(
      ['sponsor-applications', grant?.slug],
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

  const superteam = useMemo(() => {
    const isSuperteamMember =
      selectedApplication?.user.superteamLevel?.includes('Superteam') || false;
    return isSuperteamMember
      ? Superteams.find(
          (s) => s.name === selectedApplication?.user.superteamLevel,
        )
      : undefined;
  }, [selectedApplication]);
  return (
    <div className="w-full rounded-r-xl bg-white">
      {applications?.length ? (
        <>
          <div className="sticky top-12 z-20 rounded-t-xl border-b border-slate-200 bg-white py-1">
            <div className="flex w-full items-center justify-between px-4 py-2">
              <div className="flex w-full items-center gap-2">
                <EarnAvatar
                  className="h-10 w-10"
                  id={selectedApplication?.user?.id}
                  avatar={selectedApplication?.user?.photo || undefined}
                />

                <div>
                  <span className="flex gap-2">
                    <p className="w-fit text-base font-medium whitespace-nowrap text-slate-900">
                      {`${selectedApplication?.user?.firstName}`}
                    </p>
                    {superteam && (
                      <Tooltip
                        content={
                          selectedApplication?.user?.superteamLevel + ' Member'
                        }
                      >
                        <img
                          src={superteam.icons}
                          alt="Superteam Member"
                          className="size-4 rounded-full"
                        />
                      </Tooltip>
                    )}
                  </span>
                  <Link
                    href={`/earn/t/${selectedApplication?.user?.username}`}
                    className="text-brand-purple flex w-full items-center gap-1 text-xs font-medium whitespace-nowrap"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    View Profile
                    <ArrowRight className="mb-0.5 h-4 w-4" />
                  </Link>
                </div>
                <div className="self-start">
                  {isPending && <SelectLabel grantSlug={grant?.slug!} />}
                </div>
              </div>
              <div className="ph-no-capture flex w-full items-center justify-end gap-2">
                {(isPending || selectedApplication?.label === 'Spam') && (
                  <SpamButton
                    grantSlug={grant?.slug!}
                    isMultiSelectOn={isMultiSelectOn}
                  />
                )}
                {isPending && (
                  <>
                    <Button
                      className="rounded-lg border border-emerald-500 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isMultiSelectOn}
                      onClick={approveOnOpen}
                    >
                      <div className="rounded-full bg-emerald-600 p-0.5">
                        <Check className="size-1 text-white" />
                      </div>
                      Approve
                    </Button>

                    <Button
                      className="rounded-lg border border-red-500 bg-red-50 text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isMultiSelectOn}
                      onClick={rejectedOnOpen}
                    >
                      <div className="rounded-full bg-red-600 p-0.5">
                        <X className="size-1 text-white" />
                      </div>
                      Reject
                    </Button>
                  </>
                )}
                {isCompleted && (
                  <Button
                    className="rounded-lg border border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-100"
                    disabled={true}
                  >
                    <div className="flex items-center">
                      <div className="rounded-full bg-blue-600 p-0.5">
                        <Check className="size-1 text-white" />
                      </div>
                    </div>
                    Completed
                  </Button>
                )}
                {isApproved &&
                  (!grant?.airtableId ||
                    grant?.title.toLowerCase().includes('coindcx')) && (
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
                      <div className="flex items-center">
                        <div className="rounded-full bg-red-600 p-0.5">
                          <X className="size-1 text-white" />
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
                <CopyButton
                  text={selectedApplication.user.email}
                  className="flex cursor-pointer items-center justify-start gap-1 text-sm text-slate-400 underline-offset-1 hover:text-slate-500 hover:underline"
                  contentProps={{ side: 'right' }}
                >
                  <MdOutlineMail />
                  {truncateString(selectedApplication.user.email, 36)}
                </CopyButton>
              )}
              {selectedApplication?.walletAddress && (
                <CopyButton
                  text={selectedApplication.walletAddress}
                  className="flex cursor-pointer items-center justify-start gap-1 text-sm text-slate-400 underline-offset-1 hover:text-slate-500 hover:underline"
                  contentProps={{ side: 'right' }}
                >
                  <MdOutlineAccountBalanceWallet />
                  <p>
                    {truncatePublicKey(selectedApplication.walletAddress, 3)}
                  </p>
                </CopyButton>
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

                <GitHub
                  className="h-[0.9rem] w-[0.9rem] text-slate-600"
                  link={selectedApplication?.user?.github || ''}
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

          <div className="relative z-10 flex max-h-[39.7rem] w-full">
            <ScrollArea
              type="auto"
              className="flex w-2/3 flex-1 flex-col overflow-y-auto px-4"
            >
              <div className="mb-4 pt-2">
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

              {grant?.sponsor?.st && (
                <div className="mb-4">
                  <p className="mb-1 text-xs font-semibold text-slate-400 uppercase">
                    SUPERTEAM MEMBER?
                  </p>
                  <p className="text-sm font-medium whitespace-nowrap text-slate-600">
                    {selectedApplication?.user.superteamLevel?.includes(
                      'Superteam',
                    )
                      ? `Yes (${selectedApplication?.user.superteamLevel})`
                      : `No`}
                  </p>
                </div>
              )}

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
                <CopyButton
                  text={selectedApplication?.walletAddress || ''}
                  className="flex cursor-pointer items-center gap-1 text-sm font-medium whitespace-nowrap text-slate-600"
                  contentProps={{ side: 'right' }}
                  content="Click to copy"
                >
                  {selectedApplication?.walletAddress}
                  <Copy className="h-4 w-4 text-slate-400" />
                </CopyButton>
              </div>

              <InfoBox
                label={
                  isST
                    ? ST_GRANT_COPY.application.projectTitle.label
                    : 'Project Title'
                }
                content={selectedApplication?.projectTitle}
              />

              <InfoBox
                label={
                  isST
                    ? ST_GRANT_COPY.application.projectOneLiner.label
                    : 'One-Liner Description'
                }
                content={selectedApplication?.projectOneLiner}
              />

              <InfoBox
                label={
                  isST
                    ? ST_GRANT_COPY.application.projectDetails.label
                    : 'Project Details'
                }
                content={selectedApplication?.projectDetails}
                isHtml
              />

              {isST && (selectedApplication as any)?.lumaLink && (
                <InfoBox
                  label={ST_GRANT_COPY.application.lumaLink.label}
                  content={(selectedApplication as any)?.lumaLink}
                />
              )}

              <InfoBox
                label={
                  isST ? ST_GRANT_COPY.application.twitter.label : 'Twitter'
                }
                content={selectedApplication?.twitter}
              />
              {!isST && (
                <InfoBox label="Github" content={selectedApplication?.github} />
              )}
              {!isST && (
                <InfoBox
                  label="Deadline"
                  content={selectedApplication?.projectTimeline}
                />
              )}

              <InfoBox
                label={
                  isST
                    ? ST_GRANT_COPY.application.proofOfWork.label
                    : 'Proof of Work'
                }
                content={selectedApplication?.proofOfWork}
                isHtml
              />

              {isST && (selectedApplication as any)?.expenseBreakdown && (
                <InfoBox
                  label={ST_GRANT_COPY.application.expenseBreakdown.label}
                  content={(selectedApplication as any)?.expenseBreakdown}
                  isHtml
                />
              )}

              <InfoBox
                label={
                  isST
                    ? ST_GRANT_COPY.application.milestones.label
                    : 'Goals and Milestones'
                }
                content={selectedApplication?.milestones}
                isHtml
              />

              {!isST && (
                <InfoBox
                  label="Primary Key Performance Indicator"
                  content={selectedApplication?.kpi}
                  isHtml
                />
              )}

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
            </ScrollArea>
            <div className="w-1/3 max-w-[20rem] p-4">
              <Notes slug={grant?.slug} />
            </div>
          </div>
        </>
      ) : isLoading ? null : (
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
