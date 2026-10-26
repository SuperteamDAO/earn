'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { toast } from 'sonner';

import { postJson } from '@/lib/fetch-json';
import type { SubmissionLabels } from '@/prisma/enums';

import type { ReviewListing, ReviewSubmission } from '../../utils/review-rules';

// The review page's state, where Earn kept it in react-query's cache and
// jotai atoms: the submissions as last loaded (changed in place while a
// write is in flight), which one is open, and which are ticked.
interface ReviewState {
  readonly listing: ReviewListing;
  readonly submissions: ReadonlyArray<ReviewSubmission>;
  readonly updateSubmissions: (
    update: (submission: ReviewSubmission) => ReviewSubmission,
  ) => void;
  readonly selectedId: string | undefined;
  readonly setSelectedId: Dispatch<SetStateAction<string | undefined>>;
  readonly selected: ReviewSubmission | undefined;
  readonly selectedIds: ReadonlySet<string>;
  readonly setSelectedIds: Dispatch<SetStateAction<ReadonlySet<string>>>;
  // A label or notes write in flight: the open submission stays put.
  readonly isUpdating: boolean;
  readonly setUpdating: (updating: boolean) => void;
}

const ReviewContext = createContext<ReviewState | null>(null);

export function ReviewProvider({
  listing,
  submissions: loaded,
  children,
}: {
  listing: ReviewListing;
  submissions: ReadonlyArray<ReviewSubmission>;
  children: ReactNode;
}) {
  const [submissions, setSubmissions] = useState(loaded);
  const [lastLoaded, setLastLoaded] = useState(loaded);
  // Loaded again (router.refresh()): the server's word replaces ours.
  if (loaded !== lastLoaded) {
    setLastLoaded(loaded);
    setSubmissions(loaded);
  }
  const [selectedId, setSelectedId] = useState<string | undefined>(
    loaded[0]?.id,
  );
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [isUpdating, setUpdating] = useState(false);

  const updateSubmissions = useCallback(
    (update: (submission: ReviewSubmission) => ReviewSubmission) =>
      setSubmissions((current) => current.map(update)),
    [],
  );

  const value = useMemo(
    () => ({
      listing,
      submissions,
      updateSubmissions,
      selectedId,
      setSelectedId,
      selected: submissions.find((submission) => submission.id === selectedId),
      selectedIds,
      setSelectedIds,
      isUpdating,
      setUpdating,
    }),
    [
      listing,
      submissions,
      updateSubmissions,
      selectedId,
      selectedIds,
      isUpdating,
    ],
  );
  return <ReviewContext value={value}>{children}</ReviewContext>;
}

export function useReview(): ReviewState {
  const state = useContext(ReviewContext);
  if (!state) throw new Error('useReview outside ReviewProvider');
  return state;
}

export interface WinnerUpdate {
  readonly id: string;
  readonly isWinner: boolean;
  readonly winnerPosition: number | null;
}

// Earn's toggle-winner route takes this many at once.
const BATCH = 50;

// Picks or unpicks winners: shown at once, then saved (Earn's
// useToggleWinner).
export function useToggleWinner() {
  const router = useRouter();
  const { updateSubmissions } = useReview();
  return async (updates: ReadonlyArray<WinnerUpdate>) => {
    const byId = new Map(updates.map((update) => [update.id, update]));
    updateSubmissions((submission) => {
      const update = byId.get(submission.id);
      if (!update) return submission;
      // A winner can't be spam or rejected.
      return {
        ...submission,
        isWinner: update.isWinner,
        winnerPosition: update.winnerPosition,
        label:
          update.isWinner && submission.label === 'Spam'
            ? 'Unreviewed'
            : submission.label,
        status:
          update.isWinner && submission.status === 'Rejected'
            ? 'Pending'
            : submission.status,
      };
    });
    try {
      const batches = [];
      for (let i = 0; i < updates.length; i += BATCH) {
        batches.push(updates.slice(i, i + BATCH));
      }
      const results = await Promise.all(
        batches.map((batch) =>
          postJson<{ autoFixed?: boolean }>(
            '/api/sponsor-dashboard/submission/toggle-winner/',
            { submissions: batch },
          ),
        ),
      );
      if (results.some((result) => result.autoFixed)) {
        toast.info(
          "A submission can't be both a winner and marked as spam — we've adjusted its status.",
        );
      }
    } catch (error) {
      toast.error(
        'An error occurred while assigning bonus spots. Please try again.',
      );
      console.error('Failed to toggle winners:', error);
    } finally {
      router.refresh();
    }
  };
}

// Rejects submissions (Earn's useRejectSubmissions).
export function useRejectSubmissions() {
  const router = useRouter();
  const { updateSubmissions, setSelectedIds } = useReview();
  return async (ids: ReadonlyArray<string>) => {
    updateSubmissions((submission) =>
      ids.includes(submission.id)
        ? { ...submission, status: 'Rejected' }
        : submission,
    );
    setSelectedIds(new Set());
    try {
      for (let i = 0; i < ids.length; i += BATCH) {
        await postJson('/api/sponsor-dashboard/submission/reject/', {
          data: ids.slice(i, i + BATCH).map((id) => ({ id })),
        });
      }
      toast.success('Submissions rejected successfully');
    } catch {
      toast.error(
        'An error occurred while rejecting submissions. Please try again.',
      );
    } finally {
      router.refresh();
    }
  };
}

// Labels submissions, shown at once.
export function useUpdateLabel() {
  const { updateSubmissions } = useReview();
  return async (ids: ReadonlyArray<string>, label: SubmissionLabels) => {
    updateSubmissions((submission) =>
      ids.includes(submission.id) ? { ...submission, label } : submission,
    );
    await postJson(
      '/api/sponsor-dashboard/submission/update-label/',
      ids.length === 1 ? { id: ids[0], label } : { ids, label },
    );
  };
}
