import { atom } from 'jotai';

import { type TimeoutHandle } from '@/hooks/use-timeout';

export const timeoutHandleAtom = atom<TimeoutHandle | null>(null);

const popupsShowedAtom = atom(0);

const popupTimeoutAtom = atom<TimeoutHandle>();

export { popupsShowedAtom, popupTimeoutAtom };
