import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useAtom } from 'jotai';
import { ArrowRight, Check, Copy, Pencil, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import MdOutlineAccountBalanceWallet from '@/components/icons/MdOutlineAccountBalanceWallet';
import MdOutlineMail from '@/components/icons/MdOutlineMail';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-tooltip';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CircularProgress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TokenIcon } from '@/components/ui/token-icon';
import { Tooltip } from '@/components/ui/tooltip';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { truncatePublicKey } from '@/utils/truncatePublicKey';
import { truncateString } from '@/utils/truncateString';

import { type Grant, type GrantQuestion } from '@/features/grants/types';
import {
  AGENTIC_ENGINEERING_GRANT_COPY,
  COINDCX_GRANT_ID,
  isAgenticEngineeringGrant,
  ST_GRANT_COPY,
} from '@/features/grants/utils/stGrant';
import { isEligiblePeopleType } from '@/features/membership/utils/peopleEligibility';
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

const NOTES_WIDTH_STORAGE_KEY = 'grantApplicationNotesWidthPercent';
const DEFAULT_NOTES_WIDTH = 34;
const MIN_NOTES_WIDTH = 28;
const MAX_NOTES_WIDTH = 55;

const clampNotesWidth = (value: number) =>
  Math.min(MAX_NOTES_WIDTH, Math.max(MIN_NOTES_WIDTH, value));

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
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const [notesWidth, setNotesWidth] = useState(DEFAULT_NOTES_WIDTH);
  const isPending = selectedApplication?.applicationStatus === 'Pending';
  const isApproved = selectedApplication?.applicationStatus === 'Approved';
  const isRejected = selectedApplication?.applicationStatus === 'Rejected';
  const isCompleted = selectedApplication?.applicationStatus === 'Completed';

  const isNativeAndNonST = !grant?.airtableId && grant?.isNative;
  const isST = grant?.isST === true;
  const isAgenticEngineering = isAgenticEngineeringGrant(grant);
  const hasManagedTranches = isST || isAgenticEngineering;
  const applicationCopy = isST
    ? ST_GRANT_COPY.application
    : isAgenticEngineering
      ? AGENTIC_ENGINEERING_GRANT_COPY.application
      : null;

  const getAnswerQuestion = (answer: any): GrantQuestion | undefined =>
    grant?.questions?.find((question) => question.question === answer.question);

  const isLinkAnswer = (answer: any) => {
    const grantQuestion = getAnswerQuestion(answer);
    return answer.type === 'link' || grantQuestion?.type === 'link';
  };

  const queryClient = useQueryClient();

  const formattedCreatedAt = dayjs(selectedApplication?.createdAt).format(
    'DD MMM YYYY',
  );

  useEffect(() => {
    const storedWidth = Number(
      window.localStorage.getItem(NOTES_WIDTH_STORAGE_KEY),
    );
    if (Number.isFinite(storedWidth) && storedWidth > 0) {
      setNotesWidth(clampNotesWidth(storedWidth));
    }
  }, []);

  const updateNotesWidthFromPointer = useCallback((clientX: number) => {
    const container = splitContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const nextWidth = ((rect.right - clientX) / rect.width) * 100;
    const clampedWidth = clampNotesWidth(nextWidth);

    setNotesWidth(clampedWidth);
    window.localStorage.setItem(NOTES_WIDTH_STORAGE_KEY, String(clampedWidth));
  }, []);

  const handleResizePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      updateNotesWidthFromPointer(event.clientX);
    },
    [updateNotesWidthFromPointer],
  );

  const handleResizePointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        updateNotesWidthFromPointer(event.clientX);
      }
    },
    [updateNotesWidthFromPointer],
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

  const chapter = useMemo(
    () =>
      isEligiblePeopleType(selectedApplication?.user.people?.type)
        ? selectedApplication?.user.people?.chapter
        : null,
    [selectedApplication],
  );
  return (
    <div className="w-full rounded-r-xl bg-white">
      {applications?.length ? (
        <>
          <div className="sticky top-12 z-20 rounded-t-xl border-b border-slate-200 bg-white py-1">
            <div className="flex w-full flex-col gap-2 px-4 py-2 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <EarnAvatar
                  className="h-10 w-10"
                  id={selectedApplication?.user?.id}
                  avatar={selectedApplication?.user?.photo || undefined}
                />

                <div className="min-w-0">
                  <span className="flex gap-2">
                    <p className="max-w-[10.5rem] truncate text-base font-medium text-slate-900 sm:max-w-none">
                      {`${selectedApplication?.user?.firstName}`}
                    </p>
                    {chapter?.icons && (
                      <Tooltip content={`${chapter.name} Member`}>
                        <img
                          src={chapter.icons}
                          alt="Superteam Member"
                          className="size-4 rounded-full"
                        />
                      </Tooltip>
                    )}
                  </span>
                  <Link
                    href={`/earn/t/${selectedApplication?.user?.username}`}
                    className="text-brand-purple flex w-full items-center gap-1 text-xs font-medium"
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
              <div className="ph-no-capture flex w-full flex-nowrap items-center justify-start gap-1 overflow-x-auto pb-1 md:w-auto md:justify-end md:gap-2 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
                {(isPending || selectedApplication?.label === 'Spam') && (
                  <SpamButton
                    grantSlug={grant?.slug!}
                    isMultiSelectOn={isMultiSelectOn}
                  />
                )}
                <div className="md:hidden">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="shrink-0 gap-1.5 border-slate-200 text-slate-500 hover:text-slate-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Note</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[min(320px,90vw)] p-0">
                      <DialogTitle className="sr-only">Notes</DialogTitle>
                      {selectedApplication && (
                        <Notes
                          key={selectedApplication.id}
                          slug={grant?.slug}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
                {isPending && (
                  <>
                    <Button
                      className="shrink-0 rounded-lg border border-emerald-500 bg-emerald-50 px-2.5 text-[13px] text-emerald-600 hover:bg-emerald-100 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-sm"
                      disabled={isMultiSelectOn}
                      onClick={approveOnOpen}
                    >
                      <div className="rounded-full bg-emerald-600 p-0.5">
                        <Check className="size-1 text-white" />
                      </div>
                      Approve
                    </Button>

                    <Button
                      className="shrink-0 rounded-lg border border-red-500 bg-red-50 px-2.5 text-[13px] text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-sm"
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
                    className="shrink-0 rounded-lg border border-blue-500 bg-blue-50 px-2.5 text-[13px] text-blue-600 hover:bg-blue-100 disabled:opacity-100 sm:px-3 sm:text-sm"
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
                  !hasManagedTranches &&
                  (!grant?.airtableId || grant?.id === COINDCX_GRANT_ID) && (
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
                        className="shrink-0 rounded-lg border border-emerald-500 bg-emerald-50 px-2.5 text-[13px] text-emerald-600 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-100 sm:px-3 sm:text-sm"
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
                      className="shrink-0 rounded-lg border border-red-500 bg-red-50 px-2.5 text-[13px] text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-100 sm:px-3 sm:text-sm"
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

            <div className="flex flex-wrap items-center gap-2 px-4 py-2 md:gap-4">
              {isApproved && (
                <div className="flex items-center">
                  <p className="mr-3 text-sm font-semibold whitespace-nowrap text-slate-400">
                    APPROVED
                  </p>
                  <TokenIcon
                    className="mr-0.5 h-4 w-4 rounded-full"
                    alt="token"
                    symbol={grant?.token}
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

          <div
            ref={splitContainerRef}
            className="relative z-10 flex max-h-[39.7rem] w-full"
          >
          <ScrollArea
            type="auto"
            className="flex min-w-0 flex-1 flex-col overflow-y-auto px-4 md:w-2/3 md:flex-none"
          >
              <div className="mb-4 pt-2">
                <p className="mb-1 text-xs font-semibold text-slate-400 uppercase">
                  ASK
                </p>
                <div className="flex items-center gap-0.5">
                  <TokenIcon
                    className="mr-0.5 h-4 w-4 rounded-full"
                    alt="token"
                    symbol={grant?.token}
                  />

                  <p className="text-sm font-semibold whitespace-nowrap text-slate-600">
                    {`${selectedApplication?.ask?.toLocaleString('en-us')}`}
                    <span className="ml-0.5 text-slate-400">
                      {grant?.token}
                    </span>
                  </p>
                </div>
              </div>

              {grant?.sponsor?.chapter && (
                <div className="mb-4">
                  <p className="mb-1 text-xs font-semibold text-slate-400 uppercase">
                    SUPERTEAM MEMBER?
                  </p>
                  <p className="text-sm font-medium whitespace-nowrap text-slate-600">
                    {chapter ? `Yes (${chapter.name})` : `No`}
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
                  label={ST_GRANT_COPY.application.lumaLink!.label}
                  content={(selectedApplication as any)?.lumaLink}
                />
              )}

              <InfoBox
                label={applicationCopy?.twitter.label ?? 'Twitter'}
                content={selectedApplication?.twitter}
              />
              {!isST && (
                <InfoBox
                  label={applicationCopy?.github?.label ?? 'Github'}
                  content={selectedApplication?.github}
                />
              )}
              {!isST && (
                <InfoBox
                  label={applicationCopy?.projectTimeline?.label ?? 'Deadline'}
                  content={selectedApplication?.projectTimeline}
                />
              )}

              <InfoBox
                label={applicationCopy?.proofOfWork.label ?? 'Proof of Work'}
                content={selectedApplication?.proofOfWork}
                isHtml
              />

              {isST && (selectedApplication as any)?.expenseBreakdown && (
                <InfoBox
                  label={ST_GRANT_COPY.application.expenseBreakdown!.label}
                  content={(selectedApplication as any)?.expenseBreakdown}
                  isHtml
                />
              )}

              <InfoBox
                label={
                  applicationCopy?.milestones.label ?? 'Goals and Milestones'
                }
                content={selectedApplication?.milestones}
                isHtml
              />

              {!isST && (
                <InfoBox
                  label={
                    applicationCopy?.kpi?.label ??
                    'Primary Key Performance Indicator'
                  }
                  content={selectedApplication?.kpi}
                  isHtml
                />
              )}

              {Array.isArray(selectedApplication?.answers) &&
                selectedApplication.answers.map(
                  (answer: any, answerIndex: number) => {
                    const grantQuestion = getAnswerQuestion(answer);
                    const isOptional =
                      answer.optional ?? grantQuestion?.optional;
                    return (
                      <InfoBox
                        key={answerIndex}
                        label={`${answer.question}${isOptional ? ' (Optional)' : ''}`}
                        content={answer.answer}
                        isHtml={!isLinkAnswer(answer)}
                      />
                    );
                  },
                )}
            </ScrollArea>
            <button
              aria-label="Resize notes panel"
              className="group hidden w-3 shrink-0 cursor-col-resize items-stretch justify-center self-stretch focus:outline-none md:flex"
              onPointerDown={handleResizePointerDown}
              onPointerMove={handleResizePointerMove}
              type="button"
            >
              <span className="h-full w-px bg-slate-200 transition-colors group-hover:bg-slate-300 group-focus-visible:bg-slate-400" />
            </button>
            <div
              className="hidden min-h-0 min-w-0 shrink-0 p-4 md:block"
              style={{ flexBasis: `${notesWidth}%` }}
            >
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
