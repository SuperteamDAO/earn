import { atom } from 'jotai';

import { type SubmissionWithUser } from '@/interface/submission';

export const selectedSubmissionAtom = atom<SubmissionWithUser | undefined>(
  undefined,
);

export const selectedSubmissionIdsAtom = atom<Set<string>>(new Set<string>());
