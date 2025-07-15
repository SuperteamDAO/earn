import { useAtom } from 'jotai';
import { useEffect } from 'react';

import { applicationStateAtom } from '../atoms/applicationStateAtom';
import { type GrantApplicationWithTranchesAndUser } from '../queries/user-application';
import { type Grant } from '../types';

export const useApplicationState = (
  application: GrantApplicationWithTranchesAndUser | undefined,
  grant: Grant,
) => {
  const [applicationState, setApplicationState] = useAtom(
    applicationStateAtom(grant.id),
  );
  const tranches = application?.totalTranches ?? 0;

  const isST =
    grant.isNative &&
    grant.airtableId &&
    !grant.title.toLowerCase().includes('coindcx');

  const isInCooldownPeriod = () => {
    if (
      !application ||
      application.applicationStatus !== 'Rejected' ||
      !grant.title.toLowerCase().includes('coindcx')
    ) {
      return false;
    }

    const decidedAt = application.decidedAt;
    if (!decidedAt) return false;

    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const timeSinceDecision = Date.now() - new Date(decidedAt).getTime();

    return timeSinceDecision < thirtyDaysInMs;
  };

  useEffect(() => {
    if (!application) return;

    if (isInCooldownPeriod()) {
      setApplicationState('COOLDOWN');
      return;
    }

    if (application.applicationStatus === 'Pending') {
      if (grant.isNative) {
        setApplicationState('ALLOW EDIT');
      } else {
        setApplicationState('APPLIED');
      }
      return;
    }

    if (application.applicationStatus === 'Approved') {
      const validTranches = application.GrantTranche.filter(
        (tranche) => tranche.status !== 'Rejected',
      );
      const trancheNumber = validTranches.length;

      if (isST) {
        if (!application.user.isKYCVerified) {
          setApplicationState('KYC PENDING');
        } else if (application.user.isKYCVerified) {
          if (trancheNumber === 0) {
            setApplicationState('KYC APPROVED');
          } else if (trancheNumber === 1) {
            const trancheStatus = validTranches[0]?.status;
            if (trancheStatus === 'Pending')
              setApplicationState('TRANCHE1 PENDING');
            else if (trancheStatus === 'Approved')
              setApplicationState('TRANCHE1 APPROVED');
            else if (trancheStatus === 'Paid')
              setApplicationState('TRANCHE1 PAID');
          } else if (trancheNumber === 2) {
            const trancheStatus = validTranches[1]?.status;
            if (trancheStatus === 'Pending')
              setApplicationState('TRANCHE2 PENDING');
            else if (trancheStatus === 'Approved')
              setApplicationState('TRANCHE2 APPROVED');
            else if (trancheStatus === 'Paid')
              setApplicationState('TRANCHE2 PAID');
          } else if (trancheNumber === 3) {
            const trancheStatus = validTranches[2]?.status;
            if (trancheStatus === 'Pending')
              setApplicationState('TRANCHE3 PENDING');
            else if (trancheStatus === 'Approved')
              setApplicationState('TRANCHE3 APPROVED');
            else if (trancheStatus === 'Paid')
              setApplicationState('TRANCHE3 PAID');
          } else if (trancheNumber === 4) {
            const trancheStatus = validTranches[3]?.status;
            if (trancheStatus === 'Pending')
              setApplicationState('TRANCHE4 PENDING');
            else if (trancheStatus === 'Approved')
              setApplicationState('TRANCHE4 APPROVED');
            else if (trancheStatus === 'Paid')
              setApplicationState('TRANCHE4 PAID');
          }
        }
      } else {
        setApplicationState('APPLIED');
      }
    }
  }, [application, grant.id, grant.isNative, isST, setApplicationState]);

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
          text: 'Reapply Later',
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
