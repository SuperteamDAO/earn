import { useMemo } from 'react';

import type { GrantApplicationWithTranchesAndUser } from '../queries/user-application';
import type { Grant } from '../types';
import { isGrantApplicationInCooldown } from '../utils/grantApplicationCooldown';
import { isAgenticEngineeringGrant } from '../utils/stGrant';

export type ApplicationState =
  | 'ALLOW NEW'
  | 'APPLIED'
  | 'ALLOW EDIT'
  | 'COOLDOWN'
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

const TRANCHE_STATES: Record<string, ApplicationState> = {
  '1 Pending': 'TRANCHE1 PENDING',
  '1 Approved': 'TRANCHE1 APPROVED',
  '1 Paid': 'TRANCHE1 PAID',
  '2 Pending': 'TRANCHE2 PENDING',
  '2 Approved': 'TRANCHE2 APPROVED',
  '2 Paid': 'TRANCHE2 PAID',
  '3 Pending': 'TRANCHE3 PENDING',
  '3 Approved': 'TRANCHE3 APPROVED',
  '3 Paid': 'TRANCHE3 PAID',
  '4 Pending': 'TRANCHE4 PENDING',
  '4 Approved': 'TRANCHE4 APPROVED',
  '4 Paid': 'TRANCHE4 PAID',
};

// Where their latest application leaves them, as Earn's grant page reads it
// (a verified applicant with no tranche yet still sees "Submit KYC").
export function applicationStateOf(
  application: GrantApplicationWithTranchesAndUser | null | undefined,
  grant: Grant,
): ApplicationState {
  if (!application) return 'ALLOW NEW';
  if (application.applicationStatus === 'Rejected') {
    return !application.isCooldownSkipped &&
      isGrantApplicationInCooldown(application.decidedAt)
      ? 'COOLDOWN'
      : 'ALLOW NEW';
  }
  if (application.applicationStatus === 'Pending') {
    return grant.isNative ? 'ALLOW EDIT' : 'APPLIED';
  }
  if (application.applicationStatus === 'Approved') {
    const hasSpecialTranches =
      (grant.isNative && grant.airtableId) || isAgenticEngineeringGrant(grant);
    if (!hasSpecialTranches) return 'APPLIED';
    const validTranches = application.GrantTranche.filter(
      (tranche) => tranche.status !== 'Rejected',
    );
    const trancheNumber = validTranches.length;
    if (!application.user.isKYCVerified || trancheNumber === 0) {
      return 'KYC PENDING';
    }
    const status = validTranches[trancheNumber - 1]?.status;
    return TRANCHE_STATES[`${trancheNumber} ${status}`] ?? 'ALLOW NEW';
  }
  return 'ALLOW NEW';
}

export const useApplicationState = (
  application: GrantApplicationWithTranchesAndUser | null | undefined,
  grant: Grant,
) => {
  const applicationState = useMemo(
    () => applicationStateOf(application, grant),
    [application, grant],
  );
  const tranches = application?.totalTranches ?? 0;

  const getButtonConfig = () => {
    switch (applicationState) {
      case 'APPLIED':
        return {
          text: 'Applied Successfully',
          bg: 'bg-green-600',
          isDisabled: true,
          loadingText: null,
        };

      case 'ALLOW EDIT':
        return {
          text: 'Edit Application',
          bg: 'bg-white',
          isDisabled: false,
          loadingText: 'Checking Application..',
        };

      case 'COOLDOWN':
        return {
          text: 'Cooldown period',
          bg: 'bg-gray-500',
          isDisabled: true,
          loadingText: null,
        };

      case 'KYC PENDING':
        return {
          text: 'Submit KYC',
          bg: 'bg-brand-purple',
          isDisabled: false,
          loadingText: null,
        };

      case 'TRANCHE1 PENDING':
      case 'TRANCHE2 PENDING':
      case 'TRANCHE3 PENDING':
      case 'TRANCHE4 PENDING':
        return {
          text: 'Tranche Requested',
          bg: 'bg-slate-600',
          isDisabled: true,
          loadingText: null,
        };

      case 'TRANCHE1 APPROVED':
      case 'TRANCHE2 APPROVED':
      case 'TRANCHE3 APPROVED':
      case 'TRANCHE4 APPROVED':
        return {
          text: 'Payment Processing',
          bg: 'bg-slate-600',
          isDisabled: true,
          loadingText: null,
        };

      case 'TRANCHE1 PAID':
        return {
          text: 'Apply for Second Tranche',
          bg: 'bg-brand-purple',
          isDisabled: false,
          loadingText: null,
        };

      case 'TRANCHE2 PAID':
        return tranches === 3
          ? {
              text: 'Apply for Third Tranche',
              bg: 'bg-brand-purple',
              isDisabled: false,
              loadingText: null,
            }
          : {
              text: 'Apply Now',
              bg: 'bg-brand-purple',
              isDisabled: false,
              loadingText: 'Checking Application..',
            };

      case 'TRANCHE3 PAID':
        return tranches === 4
          ? {
              text: 'Apply for Fourth Tranche',
              bg: 'bg-brand-purple',
              isDisabled: false,
              loadingText: null,
            }
          : {
              text: 'Apply Now',
              bg: 'bg-brand-purple',
              isDisabled: false,
              loadingText: 'Checking Application..',
            };

      default:
        return {
          text: 'Apply Now',
          bg: 'bg-brand-purple',
          isDisabled: false,
          loadingText: 'Checking Application..',
        };
    }
  };

  return {
    applicationState,
    buttonConfig: getButtonConfig(),
    hasApplied:
      applicationState === 'APPLIED' || applicationState === 'ALLOW EDIT',
    tranches,
  };
};
