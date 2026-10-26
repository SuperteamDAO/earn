'use client';

import { LucideFlag } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDisclosure } from '@/hooks/use-disclosure';

import {
  BONUS_POSITION,
  matchesReview,
  remainingsOf,
  type ReviewFilter,
} from '../../utils/review-rules';
import { PublishResults } from '../PublishResults';
import { MultiActionModal } from './Modals/MultiActionModal';
import { PayoutSection } from './PayoutSection';
import { useReview } from './review-state';
import { SubmissionHeader } from './SubmissionHeader';
import { SubmissionList } from './SubmissionList';
import { SubmissionPanel } from './SubmissionPanel';

type MultiAction = 'bonus' | 'spam' | 'shortlist';

// A bounty's submissions review, as Earn's
// /earn/dashboard/listings/[slug]/submissions page.
export function BountySubmissions() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    listing: bounty,
    submissions,
    selectedId,
    setSelectedId,
    selectedIds: selectedSubmissionIds,
    setSelectedIds: setSelectedSubmissionIds,
    isUpdating,
  } = useReview();

  const [searchText, setSearchText] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Set<ReviewFilter>>(
    new Set(),
  );

  const activeTab =
    searchParams?.get('tab') === 'payments' ? 'payments' : 'submissions';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (value === 'submissions') params.delete('tab');
    else params.set('tab', value);
    const query = params.toString();
    setSelectedSubmissionIds(new Set());
    router.push(query ? `${pathname}?${query}` : (pathname ?? ''), {
      scroll: false,
    });
  };

  const [currentAction, setCurrentAction] = useState<MultiAction | null>(null);
  const {
    isOpen: multiActionConfrimIsOpen,
    onOpen: multiActionConfirmOnOpen,
    onClose: multiActionConfirmOnClose,
  } = useDisclosure();
  const isTogglerOpen = selectedSubmissionIds.size > 0;

  // Decided submissions drop out of the selection.
  useEffect(() => {
    setSelectedSubmissionIds((current) => {
      const next = new Set(
        [...current].filter((id) => {
          const submission = submissions.find((each) => each.id === id);
          return !(
            submission &&
            (submission.status !== 'Pending' || submission.winnerPosition)
          );
        }),
      );
      return next.size === current.size ? current : next;
    });
  }, [submissions, setSelectedSubmissionIds]);

  const remainings = useMemo(
    () => remainingsOf(bounty, submissions),
    [bounty, submissions],
  );

  const filteredSubmissions = useMemo(
    () =>
      submissions.filter((submission) =>
        matchesReview(submission, searchText, selectedFilters),
      ),
    [submissions, searchText, selectedFilters],
  );

  // The open submission stays open while it's still listed.
  useEffect(() => {
    if (isUpdating || filteredSubmissions.length === 0) return;
    if (!filteredSubmissions.some((each) => each.id === selectedId)) {
      setSelectedId(filteredSubmissions[0]?.id);
    }
  }, [filteredSubmissions, selectedId, setSelectedId, isUpdating]);

  const selectable = filteredSubmissions.filter(
    (submission) =>
      submission.status === 'Pending' && !submission.winnerPosition,
  );
  const isToggledAll =
    selectable.every((submission) =>
      selectedSubmissionIds.has(submission.id),
    ) || false;

  const toggleSubmission = (id: string) => {
    setSelectedSubmissionIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const isToggled = (id: string) => selectedSubmissionIds.has(id);

  const handleModalAction = (action: MultiAction) => {
    setCurrentAction(action);
    multiActionConfirmOnOpen();
  };

  const isMultiSelectDisabled =
    bounty.isWinnersAnnounced ||
    !bounty.rewards[BONUS_POSITION] ||
    !bounty.maxBonusSpots ||
    remainings.bonus === 0;

  const multiBonusPodiumsOverSelected = Boolean(
    bounty.rewards[BONUS_POSITION] &&
    bounty.maxBonusSpots &&
    selectedSubmissionIds.size > remainings.bonus,
  );

  const toggleAllSubmissions = () => {
    setSelectedSubmissionIds((prev) => {
      const newSet = new Set(prev);
      if (!isToggledAll) {
        selectable.forEach((submission) => newSet.add(submission.id));
      } else {
        filteredSubmissions.forEach((submission) =>
          newSet.delete(submission.id),
        );
      }
      return newSet;
    });
  };

  const usedPositions = submissions
    .filter((s) => s.isWinner)
    .map((s) => Number(s.winnerPosition))
    .filter((key) => !isNaN(key));

  const totalWinners = submissions.filter((sub) => sub.isWinner).length;
  const totalPaymentsMade = submissions.filter((sub) => sub.isPaid).length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!filteredSubmissions.length) return;

      const currentIndex = filteredSubmissions.findIndex(
        (sub) => sub.id === selectedId,
      );

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            setSelectedId(filteredSubmissions[currentIndex - 1]?.id);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < filteredSubmissions.length - 1) {
            setSelectedId(filteredSubmissions[currentIndex + 1]?.id);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredSubmissions, selectedId, setSelectedId]);

  return (
    <>
      {isOpen && (
        <PublishResults
          remainings={remainings}
          isOpen={isOpen}
          onClose={onClose}
          totalWinners={totalWinners}
          totalPaymentsMade={totalPaymentsMade}
          bounty={bounty}
          submissionsLeft={submissions.filter((s) => !s.isWinner).length}
        />
      )}
      <SubmissionHeader
        bounty={bounty}
        remainings={remainings}
        submissions={submissions}
        onWinnersAnnounceOpen={onOpen}
        activeTab={activeTab}
      />
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {bounty.isPublished && (
          <>
            <TabsList className="mt-3 gap-4 font-medium text-slate-400">
              <TabsTrigger value="submissions">
                Submissions
                <div className="text-xxs ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-slate-500">
                  {submissions.length}
                </div>
              </TabsTrigger>
              {bounty.isWinnersAnnounced && !bounty.isFndnPaying && (
                <TabsTrigger value="payments">Payments</TabsTrigger>
              )}
            </TabsList>
            <div className="h-[1.5px] w-full bg-slate-200/70" />
          </>
        )}

        <TabsContent value="submissions" className="w-full px-0">
          <div className="grid h-160 w-full grid-cols-[23rem_1fr] bg-white">
            <SubmissionList
              isHackathonPage={false}
              listing={bounty}
              selectedFilters={selectedFilters}
              onFilterChange={setSelectedFilters}
              submissions={filteredSubmissions}
              setSearchText={setSearchText}
              isToggled={isToggled}
              toggleSubmission={toggleSubmission}
              isAllToggled={isToggledAll}
              toggleAllSubmissions={toggleAllSubmissions}
              isMultiSelectDisabled={isMultiSelectDisabled}
            />

            <div className="h-full w-full rounded-r-xl border-t border-r border-b border-slate-200 bg-white">
              {!filteredSubmissions.length && !searchText ? (
                <>
                  <ExternalImage
                    className="mx-auto mt-32 w-32"
                    alt={'talent empty'}
                    src={'/bg/talent-empty.svg'}
                  />
                  <p className="mx-auto mt-5 text-center text-lg font-semibold text-slate-600">
                    {selectedFilters.size > 0
                      ? 'Zero Results'
                      : 'People are working!'}
                  </p>
                  <p className="mx-auto mb-[200px] text-center font-medium text-slate-400">
                    {selectedFilters.size > 0
                      ? 'For the filters you have selected'
                      : 'Submissions will start appearing here'}
                  </p>
                </>
              ) : (
                <SubmissionPanel
                  isMultiSelectOn={selectedSubmissionIds.size > 0}
                  bounty={bounty}
                  submissions={filteredSubmissions}
                  usedPositions={usedPositions}
                />
              )}
            </div>
          </div>

          {(!!searchText || selectedFilters.size > 0) && (
            <div className="mt-4 ml-4 flex items-center justify-start gap-4">
              <p className="text-sm text-slate-400">
                Found{' '}
                <span className="font-bold">{filteredSubmissions.length}</span>{' '}
                {filteredSubmissions.length === 1 ? 'result' : 'results'}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments">
          <PayoutSection submissions={submissions} bounty={bounty} />
        </TabsContent>
      </Tabs>

      <Dialog modal={false} open={isTogglerOpen}>
        <DialogContent
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          classNames={{
            overlay: 'hidden',
          }}
          unsetDefaultPosition
          hideCloseIcon
          className="fixed bottom-4 left-1/2 w-fit max-w-none -translate-x-1/2 overflow-hidden px-5 py-2"
        >
          <div className="mx-auto w-fit rounded-lg">
            {multiBonusPodiumsOverSelected && (
              <p className="pb-2 text-center text-sm text-red-500">
                You have {remainings.bonus || 0} bonus spots available
              </p>
            )}
            <div className="flex items-center gap-3">
              <p className="text-base font-medium whitespace-nowrap">
                {selectedSubmissionIds.size} Selected
              </p>

              <div className="h-4 w-px bg-slate-300" />

              <Button
                className="px-2 font-semibold text-slate-500"
                onClick={() => {
                  setSelectedSubmissionIds(new Set());
                }}
                variant="ghost"
              >
                UNSELECT ALL
              </Button>

              <Button
                className="rounded-lg border border-orange-300 bg-orange-50 text-orange-600 hover:bg-orange-100 disabled:opacity-50"
                disabled={selectedSubmissionIds.size === 0}
                onClick={() => handleModalAction('spam')}
              >
                <LucideFlag className="size-1" />
                Mark as Spam
              </Button>

              <Button
                className="rounded-lg border border-purple-300 bg-purple-50 text-purple-600 hover:bg-purple-100 disabled:opacity-50"
                disabled={selectedSubmissionIds.size === 0}
                onClick={() => handleModalAction('shortlist')}
              >
                Shortlist All
              </Button>

              <Button
                className="rounded-lg border border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
                disabled={
                  selectedSubmissionIds.size === 0 ||
                  multiBonusPodiumsOverSelected
                }
                onClick={() => handleModalAction('bonus')}
              >
                Assign {selectedSubmissionIds.size} Bonus
                {selectedSubmissionIds.size > 1 ? 'es' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {currentAction && (
        <MultiActionModal
          isOpen={multiActionConfrimIsOpen}
          onClose={multiActionConfirmOnClose}
          submissionIds={Array.from(selectedSubmissionIds)}
          actionType={currentAction}
        />
      )}
    </>
  );
}
