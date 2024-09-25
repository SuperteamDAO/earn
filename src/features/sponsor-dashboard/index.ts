import { atom } from 'jotai';

import { type SubmissionWithUser } from '@/interface/submission';

export * from './components';
export * from './mutations';
export * from './queries';
export * from './types';
export * from './utils';

export const selectedSubmissionAtom = atom<SubmissionWithUser | undefined>(
  undefined,
);

export const selectedSubmissionIdsAtom = atom<Set<string>>(new Set<string>());
