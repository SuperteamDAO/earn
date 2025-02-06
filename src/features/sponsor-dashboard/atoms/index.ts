import { atom } from 'jotai';

import { type SubmissionWithUser } from '@/interface/submission';

import { type GrantApplicationWithUser } from '../types';

export const selectedSubmissionAtom = atom<SubmissionWithUser | undefined>(
  undefined,
);

export const selectedGrantApplicationAtom = atom<
  GrantApplicationWithUser | undefined
>(undefined);

export const selectedSubmissionIdsAtom = atom<Set<string>>(new Set<string>());
