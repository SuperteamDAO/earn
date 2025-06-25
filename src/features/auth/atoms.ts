import { atom } from 'jotai';

export const loginEventAtom = atom<'idle' | 'fresh_login'>('idle');
