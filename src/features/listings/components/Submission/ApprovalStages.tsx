'use client';

import FaCheck from '@/components/icons/FaCheck';
import type { ViewerEntry } from '@/server/listing-details';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';
import { getPayoutCopy } from '@/utils/payout-date';

import type { Listing } from '@/features/listings/types';

interface Props {
  listing: Listing;
  // The viewer's own entry, loaded with the page; null when signed out.
  submission: ViewerEntry | null;
}

const CheckIcon = () => (
  <div className="flex h-9 w-9 items-center justify-center rounded-full border-4 border-green-600 bg-white text-green-600">
    <FaCheck />
  </div>
);

const PendingIcon = () => (
  <div className="flex h-9 w-9 items-center justify-center rounded-full border-4 border-slate-200 bg-slate-200 text-slate-200" />
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
  <div className="absolute top-9 left-4 h-12 w-1">
    {isStartComplete && isEndComplete ? (
      <div className="h-full bg-green-600" />
    ) : isStartComplete ? (
      <>
        <div className="h-1/3 bg-green-600" />
        <div className="h-2/3 bg-slate-200" />
      </>
    ) : (
      <div className="h-full bg-slate-200" />
    )}
  </div>
);

export const ApprovalStages = ({ listing, submission }: Props) => {
  if (!submission?.isWinner) return null;

  const isKycVerified = submission.isKYCVerified ?? false;
  const isPaid = submission.isPaid ?? false;

  const isPaymentSynced = submission.paymentSynced ?? false;

  const isHackathon = listing.type === 'hackathon';
  const wonTitle = isHackathon ? 'Hackathon Track Won' : 'Bounty Won';

  const token = listing.token || 'USDC';
  const rewardAmount = submission.winnerPosition
    ? (listing.rewards?.[submission.winnerPosition] ?? 0)
    : 0;

  return (
    <div className="relative mt-6">
      <div className="space-y-8">
        <div className="relative flex items-start gap-4">
          <div className="relative z-10">
            <CheckIcon />
          </div>
          <ConnectingLine
            isStartComplete={true}
            isEndComplete={isKycVerified}
          />
          <div>
            <Heading>{wonTitle}</Heading>
            <Subheading>
              Won {formatNumberWithSuffix(rewardAmount, 1, true)} {token}
            </Subheading>
          </div>
        </div>

        <div className="relative flex items-start gap-4">
          <div className="relative z-10">
            {isKycVerified ? <CheckIcon /> : <PendingIcon />}
          </div>
          <ConnectingLine
            isStartComplete={isKycVerified}
            isEndComplete={isPaymentSynced}
          />
          <div>
            <Heading>KYC Successful</Heading>
            <Subheading>Documents verified</Subheading>
          </div>
        </div>

        <div className="relative flex items-start gap-4">
          <div className="relative z-10">
            {isPaymentSynced ? <CheckIcon /> : <PendingIcon />}
          </div>
          <ConnectingLine
            isStartComplete={isPaymentSynced}
            isEndComplete={isPaid}
          />
          <div>
            <Heading>Payment Processing</Heading>
            <Subheading>
              {isPaid
                ? 'Payment completed'
                : getPayoutCopy({
                    winnerAnnouncedAt: listing.winnersAnnouncedAt,
                    kycVerifiedAt: submission.kycVerifiedAt,
                  })}
            </Subheading>
          </div>
        </div>

        <div className="relative flex items-start gap-4">
          <div className="relative z-10">
            {isPaid ? <CheckIcon /> : <PendingIcon />}
          </div>
          <div>
            <Heading>Reward Paid</Heading>
            <Subheading>
              {formatNumberWithSuffix(rewardAmount, 1, true)} {token} sent to
              your Earn wallet
            </Subheading>
          </div>
        </div>
      </div>
    </div>
  );
};
