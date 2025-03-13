import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';

export type ApplicationState =
  | 'ALLOW NEW'
  | 'APPLIED'
  | 'ALLOW EDIT'
  | 'KYC PENDING'
  | 'KYC APPROVED'
  | 'TRANCHE1 PENDING'
  | 'TRANCHE1 APPROVED'
  | 'TRANCHE1 PAID'
  | 'TRANCHE2 PENDING'
  | 'TRANCHE2 APPROVED'
  | 'TRANCHE2 PAID'
  | 'TRANCHE3 PENDING'
  | 'TRANCHE3 APPROVED'
  | 'TRANCHE3 PAID'
  | 'TRANCHE4 PENDING'
  | 'TRANCHE4 APPROVED'
  | 'TRANCHE4 PAID';

export const applicationStateAtom = atomFamily(
  (_grantId: string) => atom<ApplicationState>('ALLOW NEW'),
  (a, b) => a === b,
);
