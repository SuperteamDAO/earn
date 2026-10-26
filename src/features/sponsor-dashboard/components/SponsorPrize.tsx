import { formatNumberWithSuffix } from '@/utils/formatNumberWithSuffix';

interface CompensationAmountType {
  compensationType?: 'fixed' | 'range' | 'variable';
  rewardAmount?: number;
  className?: string;
}

export const SponsorPrize = ({
  compensationType,
  rewardAmount,
  className,
}: CompensationAmountType) => {
  return (
    <p className={className}>
      {compensationType === 'fixed'
        ? formatNumberWithSuffix(rewardAmount ?? 0, 2, true)
        : null}
    </p>
  );
};
