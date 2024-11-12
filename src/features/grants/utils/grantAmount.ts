import { formatNumberWithSuffix } from '@/utils';

export function grantAmount({
  minReward,
  maxReward,
}: {
  minReward: number;
  maxReward: number;
}) {
  if (minReward && maxReward && minReward > 0) {
    return `${formatNumberWithSuffix(minReward)}-${formatNumberWithSuffix(maxReward)}`;
  } else {
    return `Up to ${formatNumberWithSuffix(maxReward!)}`;
  }
}
