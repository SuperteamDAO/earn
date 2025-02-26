import { atom } from 'jotai';

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

const applicationStateAtom = atom<ApplicationState>('ALLOW NEW');

export { applicationStateAtom };
