import { useAtom } from 'jotai';
import { FaCheck } from 'react-icons/fa';

import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import {
  type ApplicationState,
  applicationStateAtom,
} from '../atoms/applicationStateAtom';
import { type GrantApplicationWithTranches } from '../queries/user-application';
import { type GrantWithApplicationCount } from '../types';

interface Props {
  application: GrantApplicationWithTranches;
  grant: GrantWithApplicationCount;
}

export const ApprovalStages = ({ application, grant }: Props) => {
  const [applicationState] = useAtom(applicationStateAtom);

  const isStateCompleted = (state: ApplicationState) => {
    const stateOrder: ApplicationState[] = [
      'ALLOW NEW',
      'APPLIED',
      'ALLOW EDIT',
      'KYC PENDING',
      'KYC APPROVED',
      'TRANCHE1 PENDING',
      'TRANCHE1 APPROVED',
      'TRANCHE1 PAID',
      'TRANCHE2 PENDING',
      'TRANCHE2 APPROVED',
      'TRANCHE2 PAID',
      'TRANCHE3 PENDING',
      'TRANCHE3 APPROVED',
      'TRANCHE3 PAID',
      'TRANCHE4 PENDING',
      'TRANCHE4 APPROVED',
      'TRANCHE4 PAID',
    ];

    const currentStateIndex = stateOrder.indexOf(applicationState);
    const checkStateIndex = stateOrder.indexOf(state);

    return currentStateIndex >= checkStateIndex && checkStateIndex !== -1;
  };

  const getTrancheStatus = (trancheNum: number) => {
    if (isStateCompleted(`TRANCHE${trancheNum} PAID` as ApplicationState))
      return 'Paid';
    if (isStateCompleted(`TRANCHE${trancheNum} APPROVED` as ApplicationState))
      return 'Approved';
    if (isStateCompleted(`TRANCHE${trancheNum} PENDING` as ApplicationState))
      return 'Pending';
    return 'Pending';
  };

  const tranchesCount = application?.totalTranches ?? 0;

  const tranches = Array.from({ length: tranchesCount }, (_, i) => {
    const approvedAmount = application?.approvedAmount ?? 0;
    const currentTranche = application?.GrantTranche?.[i];
    let amount;

    if (currentTranche) {
      amount =
        currentTranche.status === 'Pending'
          ? currentTranche.ask
          : currentTranche.approvedAmount;
    } else {
      if (approvedAmount <= 5000) {
        amount = approvedAmount * 0.5;
      } else {
        if (i === 0 || i === 1) {
          amount = approvedAmount * 0.3;
        } else {
          amount = approvedAmount * 0.4;
        }
      }
    }

    return {
      status: getTrancheStatus(i + 1),
      amount: Math.floor(amount ?? 0),
    };
  });

  const CheckIcon = () => (
    <div className="flex h-9 w-9 items-center justify-center rounded-full border-[4px] border-green-600 bg-white text-green-600">
      <FaCheck />
    </div>
  );

  const PendingIcon = () => (
    <div className="flex h-9 w-9 items-center justify-center rounded-full border-[4px] border-slate-200 bg-slate-200 text-slate-200" />
  );

  const Heading = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-sm font-semibold text-slate-700">{children}</h3>
  );

  const Subheading = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[0.8rem] text-slate-500">{children}</p>
  );

  const ConnectingLine = ({
    isStartComplete,
    isEndComplete,
  }: {
    isStartComplete: boolean;
    isEndComplete: boolean;
  }) => (
    <div className="absolute left-4 top-[36px] h-[72px] w-[4px]">
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
            isEndComplete={isStateCompleted('KYC APPROVED')}
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
            {isStateCompleted('KYC APPROVED') ? <CheckIcon /> : <PendingIcon />}
          </div>
          <ConnectingLine
            isStartComplete={isStateCompleted('KYC APPROVED')}
            isEndComplete={tranches[0]?.status === 'Paid'}
          />
          <div>
            <Heading>KYC Successful</Heading>
            <Subheading>Documents verified</Subheading>
          </div>
        </div>

        {tranches.map((tranche, index) => (
          <div key={index} className="relative flex items-start gap-4">
            <div className="relative z-10">
              {tranche.status === 'Paid' ? <CheckIcon /> : <PendingIcon />}
            </div>
            {index < tranches.length - 1 && (
              <ConnectingLine
                isStartComplete={tranche.status === 'Paid'}
                isEndComplete={tranches[index + 1]?.status === 'Paid'}
              />
            )}
            <div>
              <Heading>
                {index === tranches.length - 1
                  ? 'Final Tranche Paid'
                  : index === 0
                    ? 'Payment Processed'
                    : index === 1
                      ? 'Second Tranche Paid'
                      : 'Third Tranche Paid'}
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
