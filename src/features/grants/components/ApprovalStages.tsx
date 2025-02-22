import { GoCheckCircle } from 'react-icons/go';

import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import { useApplicationState } from '../hooks/useApplicationState';
import { type GrantApplicationWithTranches } from '../queries/user-application';
import { type GrantWithApplicationCount } from '../types';

interface Props {
  application: GrantApplicationWithTranches;
  grant: GrantWithApplicationCount;
}

export const ApprovalStages = ({ application, grant }: Props) => {
  const { applicationState } = useApplicationState(application, grant);

  const isKYCCompleted =
    !applicationState.includes('KYC') || applicationState === 'KYC APPROVED';

  const getTrancheStatus = (trancheNum: number) => {
    if (applicationState.includes(`TRANCHE${trancheNum} PAID`)) return 'PAID';
    if (applicationState.includes(`TRANCHE${trancheNum}`)) return 'IN_PROGRESS';
    return 'PENDING';
  };

  const tranchesCount = (application?.approvedAmount ?? 0) > 5000 ? 3 : 2;
  const tranches = Array.from({ length: tranchesCount }, (_, i) => ({
    status: getTrancheStatus(i + 1),
    amount: Math.floor(application?.approvedAmount ?? 0 / tranchesCount),
  }));

  const CheckIcon = () => (
    <GoCheckCircle className="h-8 w-8 bg-white text-green-500" />
  );

  return (
    <div className="relative">
      <div className="absolute left-[15px] top-8 h-[calc(100%-32px)] w-[2px] bg-gray-200" />
      <div className="space-y-8">
        <div className="flex items-start gap-4">
          <div className="relative z-10">
            <CheckIcon />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Grant Approved</h3>
            <p className="text-sm text-gray-500">
              Grant approved for{' '}
              {formatNumberWithSuffix(
                application?.approvedAmount ?? 0,
                1,
                true,
              )}{' '}
              {grant.token}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="relative z-10">
            {isKYCCompleted ? (
              <CheckIcon />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-200" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">KYC Successful</h3>
            <p className="text-sm text-gray-500">Documents verified</p>
          </div>
        </div>

        {tranches.map((tranche, index) => (
          <div key={index} className="flex items-start gap-4">
            <div className="relative z-10">
              {tranche.status === 'PAID' ? (
                <CheckIcon />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-200" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">
                {index === tranches.length - 1
                  ? 'Final Tranche Paid'
                  : index === 0
                    ? 'Payment Processed'
                    : `Second Tranche Paid`}
              </h3>
              <p className="text-sm text-gray-500">
                {tranche.status === 'PAID'
                  ? `${formatNumberWithSuffix(tranche.amount, 1, true)} ${grant.token} sent to you`
                  : index === tranches.length - 1
                    ? 'Project completed successfully'
                    : 'Pending payment'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
