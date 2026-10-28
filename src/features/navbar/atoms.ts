import { atom } from 'jotai';

import { type status } from '@/prisma/enums';

type BountySnackbarType = {
  isCaution: boolean | undefined;
  submissionCount: number;
  deadline: string | undefined;
  rewardAmount: number | undefined;
  type: string | undefined;
  isPublished: boolean | undefined;
  status?: status;
  sponsorId: string | undefined;
  slug: string | undefined;
};

export const bountySnackbarAtom = atom<BountySnackbarType | null>(null);

type GrantSnackbarType = {
  isPublished: boolean;
};

export const grantSnackbarAtom = atom<GrantSnackbarType | null>(null);
