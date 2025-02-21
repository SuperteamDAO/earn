import { useAtom } from 'jotai';

import { applicationStateAtom } from '../atoms/applicationStateAtom';
import { type GrantApplicationWithTranches } from '../queries/user-application';
import { type Grant } from '../types';

export const useApplicationState = (
  application: GrantApplicationWithTranches | undefined,
  grant: Grant,
) => {
  const [applicationState, setApplicationState] = useAtom(applicationStateAtom);

  if (application?.applicationStatus === 'Pending') {
    setApplicationState('APPLIED');

    if (grant.isNative) {
      setApplicationState('ALLOW EDIT');
    }
  }
  if (application?.applicationStatus === 'Approved') {
    if (application?.kycStatus === 'PENDING') {
      setApplicationState('KYC PENDING');
    } else if (application?.kycStatus === 'APPROVED') {
      if (application?.GrantTranche.length === 0) {
        setApplicationState('KYC APPROVED');
      } else if (application?.GrantTranche.length === 1) {
        if (application?.GrantTranche[0]?.status === 'PENDING') {
          setApplicationState('TRANCHE1 PENDING');
        } else if (application?.GrantTranche[0]?.status === 'APPROVED') {
          setApplicationState('TRANCHE1 APPROVED');
        }
      } else if (application?.GrantTranche.length === 2) {
        if (application?.GrantTranche[1]?.status === 'PENDING') {
          setApplicationState('TRANCHE2 PENDING');
        } else if (application?.GrantTranche[1]?.status === 'APPROVED') {
          setApplicationState('TRANCHE2 APPROVED');
        }
      } else if (application?.GrantTranche.length === 3) {
        if (application?.GrantTranche[2]?.status === 'PENDING') {
          setApplicationState('TRANCHE3 PENDING');
        } else if (application?.GrantTranche[2]?.status === 'APPROVED') {
          setApplicationState('TRANCHE3 APPROVED');
        }
      }
    }
  }

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
          bg: 'bg-brand-purple',
          isDisabled: false,
          loadingText: 'Checking Application..',
        };

      case 'KYC PENDING':
        return {
          text: 'Submit KYC',
          bg: 'bg-brand-purple',
          isDisabled: false,
          loadingText: null,
        };

      case 'KYC APPROVED':
        return {
          text: 'Apply for 1st Tranche',
          bg: 'bg-brand-purple',
          isDisabled: false,
          loadingText: null,
        };

      case 'TRANCHE1 PENDING':
        return {
          text: 'Tranche Requested',
          bg: 'bg-slate-600',
          isDisabled: true,
          loadingText: null,
        };

      case 'TRANCHE1 APPROVED':
        return {
          text: 'Apply for 2nd Tranche',
          bg: 'bg-brand-purple',
          isDisabled: false,
          loadingText: null,
        };

      case 'TRANCHE2 PENDING':
        return {
          text: 'Tranche Requested',
          bg: 'bg-slate-600',
          isDisabled: true,
          loadingText: null,
        };

      case 'TRANCHE2 APPROVED':
        return {
          text: 'Apply for 3rd Tranche',
          bg: 'bg-brand-purple',
          isDisabled: false,
          loadingText: null,
        };

      case 'TRANCHE3 PENDING':
        return {
          text: 'Tranche Requested',
          bg: 'bg-slate-600',
          isDisabled: true,
          loadingText: null,
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
  };
};
