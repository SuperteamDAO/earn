import { useAtom } from 'jotai';
import { useEffect } from 'react';

import { applicationStateAtom } from '../atoms/applicationStateAtom';
import { type GrantApplicationWithTranches } from '../queries/user-application';
import { type Grant } from '../types';

export const useApplicationState = (
  application: GrantApplicationWithTranches | undefined,
  grant: Grant,
) => {
  const [applicationState, setApplicationState] = useAtom(applicationStateAtom);
  const approvedAmount = application?.approvedAmount;
  const tranches = approvedAmount && approvedAmount > 5000 ? 3 : 2;

  useEffect(() => {
    if (!application) return;

    if (application.applicationStatus === 'Pending') {
      setApplicationState('APPLIED');
      if (grant.isNative) {
        setApplicationState('ALLOW EDIT');
      }
      return;
    }

    if (application.applicationStatus === 'Approved') {
      if (application.kycStatus === 'Pending') {
        setApplicationState('KYC PENDING');
      } else if (application.kycStatus === 'Approved') {
        if (application.GrantTranche.length === 0) {
          setApplicationState('KYC APPROVED');
        } else if (application.GrantTranche.length === 1) {
          const status = application.GrantTranche[0]?.status;
          if (status === 'Pending') setApplicationState('TRANCHE1 PENDING');
          else if (status === 'Approved')
            setApplicationState('TRANCHE1 APPROVED');
          else if (status === 'Paid') setApplicationState('TRANCHE1 PAID');
        } else if (application.GrantTranche.length === 2) {
          const status = application.GrantTranche[1]?.status;
          if (status === 'Pending') setApplicationState('TRANCHE2 PENDING');
          else if (status === 'Approved')
            setApplicationState('TRANCHE2 APPROVED');
          else if (status === 'Paid') setApplicationState('TRANCHE2 PAID');
        } else if (application.GrantTranche.length === 3 && tranches === 3) {
          const status = application.GrantTranche[2]?.status;
          if (status === 'Pending') setApplicationState('TRANCHE3 PENDING');
          else if (status === 'Approved')
            setApplicationState('TRANCHE3 APPROVED');
          else if (status === 'Paid') setApplicationState('TRANCHE3 PAID');
        }
      }
    }
  }, [application, grant.isNative, tranches, setApplicationState]);

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

      case 'KYC PENDING':
        return {
          text: 'Submit KYC',
          bg: 'bg-brand-purple',
          isDisabled: false,
          loadingText: null,
        };

      case 'KYC APPROVED':
        return {
          text: 'Apply for First Tranche',
          bg: 'bg-brand-purple',
          isDisabled: false,
          loadingText: null,
        };

      case 'TRANCHE1 PENDING':
      case 'TRANCHE2 PENDING':
      case 'TRANCHE3 PENDING':
        return {
          text: 'Tranche Requested',
          bg: 'bg-slate-600',
          isDisabled: true,
          loadingText: null,
        };

      case 'TRANCHE1 APPROVED':
      case 'TRANCHE2 APPROVED':
      case 'TRANCHE3 APPROVED':
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
        return {
          text: 'All Tranches Paid',
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
    tranches,
  };
};
