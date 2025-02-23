import { FaCheck } from 'react-icons/fa';

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
  const tranches = Array.from({ length: tranchesCount }, (_, i) => {
    const approvedAmount = application?.approvedAmount ?? 0;
    let amount;

    if (approvedAmount <= 5000) {
      amount = approvedAmount * 0.5;
    } else {
      if (i === 0 || i === 1) {
        amount = approvedAmount * 0.3;
      } else {
        amount = approvedAmount * 0.4;
      }
    }

    return {
      status: getTrancheStatus(i + 1),
      amount: Math.floor(amount),
    };
  });

  const CheckIcon = () => (
    <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border-[4px] border-green-600 bg-white text-green-600">
      <FaCheck />
    </div>
  );

  const PendingIcon = () => (
    <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border-[4px] border-slate-200 bg-slate-200 text-slate-200" />
  );

  const Heading = ({ children }: { children: React.ReactNode }) => (
    <h3 className="font-semibold text-slate-700">{children}</h3>
  );

  const Subheading = ({ children }: { children: React.ReactNode }) => (
    <p className="text-sm text-slate-500">{children}</p>
  );

  const ConnectingLine = ({
    isStartComplete,
    isEndComplete,
  }: {
    isStartComplete: boolean;
    isEndComplete: boolean;
  }) => (
    <div className="absolute left-4 top-[40px] h-[72px] w-[4px]">
      {isStartComplete && isEndComplete ? (
        <div className="h-full bg-green-600" />
      ) : isStartComplete ? (
        <>
          <div className="h-1/6 bg-green-600" />
          <div className="h-5/6 bg-slate-200" />
        </>
      ) : (
        <div className="h-full bg-slate-200" />
      )}
    </div>
  );

  return (
    <div className="relative mt-6">
      <div className="space-y-8">
        <div className="relative flex items-start gap-4">
          <div className="relative z-10">
            <CheckIcon />
          </div>
          <ConnectingLine
            isStartComplete={true}
            isEndComplete={isKYCCompleted}
          />
          <div>
            <Heading>Grant Approved</Heading>
            <Subheading>
              Grant approved for{' '}
              {formatNumberWithSuffix(
                application?.approvedAmount ?? 0,
                1,
                true,
              )}{' '}
              {grant.token}
            </Subheading>
          </div>
        </div>

        <div className="relative flex items-start gap-4">
          <div className="relative z-10">
            {isKYCCompleted ? <CheckIcon /> : <PendingIcon />}
          </div>
          <ConnectingLine
            isStartComplete={isKYCCompleted}
            isEndComplete={tranches[0]?.status === 'PAID'}
          />
          <div>
            <Heading>KYC Successful</Heading>
            <Subheading>Documents verified</Subheading>
          </div>
        </div>

        {tranches.map((tranche, index) => (
          <div key={index} className="relative flex items-start gap-4">
            <div className="relative z-10">
              {tranche.status === 'PAID' ? <CheckIcon /> : <PendingIcon />}
            </div>
            {index < tranches.length - 1 && (
              <ConnectingLine
                isStartComplete={tranche.status === 'PAID'}
                isEndComplete={tranches[index + 1]?.status === 'PAID'}
              />
            )}
            <div>
              <Heading>
                {index === tranches.length - 1
                  ? 'Final Tranche Paid'
                  : index === 0
                    ? 'Payment Processed'
                    : `Second Tranche Paid`}
              </Heading>
              <Subheading>
                {index === tranches.length - 1
                  ? 'Project completed successfully'
                  : `${formatNumberWithSuffix(tranche.amount, 1, true)} ${grant.token} sent to you`}
              </Subheading>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
