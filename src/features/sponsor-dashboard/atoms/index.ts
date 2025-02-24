import { atom } from 'jotai';

import { type SubmissionWithUser } from '@/interface/submission';

import { type GrantTrancheWithApplication } from '../queries/tranches';
import { type GrantApplicationWithUser } from '../types';

type Updater<T> = (prev: T) => T;
export const selectedSubmissionIdsAtom = atom<Set<string>>(new Set<string>());

const baseSelectedSubmissionAtom = atom<SubmissionWithUser | undefined>(
  undefined,
);
const baseSelectedGrantApplicationAtom = atom<
  GrantApplicationWithUser | undefined
>(undefined);

const baseSelectedGrantTrancheAtom = atom<
  GrantTrancheWithApplication | undefined
>(undefined);

export const isNotesUpdatingAtom = atom<boolean>(false);

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
    const isUpdating = get(isNotesUpdatingAtom);
    if (!isUpdating) {
      const prevValue = get(baseSelectedSubmissionAtom);
      const newValue =
        typeof update === 'function'
          ? (update as Updater<SubmissionWithUser | undefined>)(prevValue)
          : update;
      set(baseSelectedSubmissionAtom, newValue);
    }
  },
);

export const selectedGrantApplicationAtom = atom(
  (get) => get(baseSelectedGrantApplicationAtom),
  (
    get,
    set,
    update:
      | GrantApplicationWithUser
      | undefined
      | Updater<GrantApplicationWithUser | undefined>,
  ) => {
    const isUpdating = get(isNotesUpdatingAtom);
    if (!isUpdating) {
      const prevValue = get(baseSelectedGrantApplicationAtom);
      const newValue =
        typeof update === 'function'
          ? (update as Updater<GrantApplicationWithUser | undefined>)(prevValue)
          : update;
      set(baseSelectedGrantApplicationAtom, newValue);
    }
  },
);

export const selectedGrantTrancheAtom = atom(
  (get) => get(baseSelectedGrantTrancheAtom),
  (
    get,
    set,
    update:
      | GrantTrancheWithApplication
      | undefined
      | Updater<GrantTrancheWithApplication | undefined>,
  ) => {
    const isUpdating = get(isNotesUpdatingAtom);
    if (!isUpdating) {
      const prevValue = get(baseSelectedGrantTrancheAtom);
      const newValue =
        typeof update === 'function'
          ? (update as Updater<GrantTrancheWithApplication | undefined>)(
              prevValue,
            )
          : update;
      set(baseSelectedGrantTrancheAtom, newValue);
    }
  },
);

export const applicationsAtom = atom<GrantApplicationWithUser[]>([]);
