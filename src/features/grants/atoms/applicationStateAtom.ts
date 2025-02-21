import { atom } from 'jotai';

type ApplicationState =
  | 'ALLOW NEW'
  | 'APPLIED'
  | 'ALLOW EDIT'
  | 'KYC PENDING'
  | 'KYC APPROVED'
  | 'TRANCHE1 PENDING'
  | 'TRANCHE1 APPROVED'
  | 'TRANCHE2 PENDING'
  | 'TRANCHE2 APPROVED'
  | 'TRANCHE3 PENDING'
  | 'TRANCHE3 APPROVED';

const applicationStateAtom = atom<ApplicationState>('ALLOW NEW');

export { applicationStateAtom };
