'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { ExternalImage } from '@/components/ui/cloudinary-image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDisclosure } from '@/hooks/use-disclosure';

import {
  matchesReview,
  remainingsOf,
  type ReviewFilter,
} from '../../utils/review-rules';
import { PublishResults } from '../PublishResults';
import { useReview } from './review-state';
import { SubmissionHeader } from './SubmissionHeader';
import { SubmissionList } from './SubmissionList';
import { SubmissionPanel } from './SubmissionPanel';

// A hackathon track's submissions, as Earn's
// /earn/dashboard/hackathon/[listing]/submissions page: read-only review.
export function HackathonSubmissions() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const searchParams = useSearchParams();
  const { listing: bounty, submissions, setSelectedId } = useReview();

  const [searchText, setSearchText] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Set<ReviewFilter>>(
    new Set(),
  );

  const filteredSubmissions = useMemo(
    () =>
      submissions.filter((submission) =>
        matchesReview(submission, searchText, selectedFilters),
      ),
    [submissions, searchText, selectedFilters],
  );

  useEffect(() => {
    if (filteredSubmissions.length > 0) {
      setSelectedId(filteredSubmissions[0]?.id);
    }
  }, [filteredSubmissions, setSelectedId]);

  const remainings = useMemo(
    () => remainingsOf(bounty, submissions),
    [bounty, submissions],
  );

  const usedPositions = submissions
    .filter((s) => s.isWinner)
    .map((s) => Number(s.winnerPosition))
    .filter((key) => !isNaN(key));

  const totalWinners = submissions.filter((sub) => sub.isWinner).length;
  const totalPaymentsMade = submissions.filter((sub) => sub.isPaid).length;

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
        isHackathonPage
        remainings={remainings}
        submissions={submissions}
        onWinnersAnnounceOpen={onOpen}
        activeTab={searchParams?.get('tab') || 'submissions'}
      />
      <Tabs defaultValue="submissions">
        <TabsList className="mt-4 gap-4 border-b font-medium text-slate-400">
          <TabsTrigger value="submissions">Submissions</TabsTrigger>

          {bounty.isPublished && bounty.isWinnersAnnounced && (
            <TabsTrigger value="submissions">Payments</TabsTrigger>
          )}
        </TabsList>
        <div className="h-0.5 w-full bg-slate-200" />

        <TabsContent value="submissions" className="w-full px-0">
          <div className="flex w-full items-start bg-white">
            <div className="grid min-h-[600px] w-full grid-cols-[23rem_1fr] bg-white">
              <div className="h-full w-full">
                <SubmissionList
                  isHackathonPage={true}
                  listing={bounty}
                  selectedFilters={selectedFilters}
                  onFilterChange={setSelectedFilters}
                  submissions={filteredSubmissions}
                  setSearchText={setSearchText}
                  isMultiSelectDisabled
                />
              </div>

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
                    bounty={bounty}
                    submissions={filteredSubmissions}
                    usedPositions={usedPositions}
                    isHackathonPage
                  />
                )}
              </div>
            </div>
          </div>

          {(!!searchText || selectedFilters.size > 0) && (
            <div className="mt-4 flex items-center justify-start gap-4">
              <p className="text-sm text-slate-400">
                Found{' '}
                <span className="font-bold">{filteredSubmissions.length}</span>{' '}
                {filteredSubmissions.length === 1 ? 'result' : 'results'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
