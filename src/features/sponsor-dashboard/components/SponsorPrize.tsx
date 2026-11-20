import { type CompensationType } from '@/prisma/enums';
import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

interface CompensationAmountType {
  compensationType?: CompensationType;
  rewardAmount?: number | null;
  minRewardAsk?: number | null;
  maxRewardAsk?: number | null;
  className?: string;
}

export const SponsorPrize = ({
  compensationType,
  rewardAmount,
  minRewardAsk,
  maxRewardAsk,
  className,
}: CompensationAmountType) => {
  return (
    <p className={className}>
      {(() => {
        switch (compensationType) {
          case 'fixed':
            return <>{formatNumberWithSuffix(rewardAmount!, 2, true)}</>;
          case 'range':
            return (
              <>
                {`${formatNumberWithSuffix(minRewardAsk!)}-${formatNumberWithSuffix(maxRewardAsk!)}`}
              </>
            );
          case 'variable':
            return <>Variable</>;
          default:
            return null;
        }
      })()}
    </p>
  );
};
