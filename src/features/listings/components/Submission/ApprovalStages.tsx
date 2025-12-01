import { usePrivy } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';

import FaCheck from '@/components/icons/FaCheck';
import { useUser } from '@/store/user';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

import type { Listing } from '@/features/listings/types';

import { userSubmissionQuery } from '../../queries/user-submission-status';
import { getPayoutCopy } from '../../utils/payout-date';
import { checkKycCountryMatchesRegion } from '../../utils/region';

interface Props {
  listing: Listing;
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

export const ApprovalStages = ({ listing }: Props) => {
  const { user } = useUser();
  const { authenticated, ready } = usePrivy();
  const isAuthenticated = authenticated;

  const { data: submission, isLoading: isUserSubmissionLoading } = useQuery({
    ...userSubmissionQuery(listing.id!, user?.id),
    enabled: ready && isAuthenticated && !!user?.id,
  });

  if (isUserSubmissionLoading || !ready || !submission?.isWinner) return null;

  const isKycVerified = submission.isKYCVerified ?? false;
  const isPaid = submission.isPaid;

  const isPaymentSynced = submission.paymentSynced ?? false;

  const kycCountryCheck = checkKycCountryMatchesRegion(
    (submission as any).kycCountry,
    (submission as any).listingRegion || listing.region,
  );
  const isKycValidForRegion = isKycVerified && kycCountryCheck.isValid;

  const isHackathon = listing.type === 'hackathon';
  const wonTitle = isHackathon ? 'Hackathon Track Won' : 'Bounty Won';

  const token = listing.token || 'USDC';
  const rewardAmount = submission.winnerPosition
    ? (listing.rewards?.[Number(submission.winnerPosition)] ?? 0)
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
            isEndComplete={isKycValidForRegion}
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
            {isKycValidForRegion ? <CheckIcon /> : <PendingIcon />}
          </div>
          <ConnectingLine
            isStartComplete={isKycValidForRegion}
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
