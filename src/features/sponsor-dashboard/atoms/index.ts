import { atom } from 'jotai';

import type { SubmissionWithUser } from '@/interface/submission';

type Updater<T> = (prev: T) => T;
export const selectedSubmissionIdsAtom = atom<Set<string>>(new Set<string>());

const baseSelectedSubmissionAtom = atom<SubmissionWithUser | undefined>(
  undefined,
);
export const isStateUpdatingAtom = atom<boolean>(false);

export const selectedSubmissionAtom = atom(
  (get) => get(baseSelectedSubmissionAtom),
  (
    get,
    set,
    update:
      | SubmissionWithUser
      | undefined
      | Updater<SubmissionWithUser | undefined>,
  ) => {
    const isUpdating = get(isStateUpdatingAtom);
    if (!isUpdating) {
      const prevValue = get(baseSelectedSubmissionAtom);
      const newValue =
        typeof update === 'function' ? update(prevValue) : update;
      set(baseSelectedSubmissionAtom, newValue);
    }
  },
);
