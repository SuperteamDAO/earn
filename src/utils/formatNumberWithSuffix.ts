export const formatNumberWithSuffix = ({
  amount,
  skipThousands = false,
}: {
  amount: number;
  skipThousands?: boolean;
}) => {
  if (isNaN(amount)) return null;

  if (amount < 1000 || (skipThousands && amount < 1000000))
    return amount?.toString();

  const suffixes = ['', 'k', 'm'];
  const tier = (Math.log10(amount) / 3) | 0;

  const adjustedTier = skipThousands ? Math.max(tier, 1) : tier;

  if (adjustedTier === 0) return amount.toString();

  const suffix = suffixes[adjustedTier];
  const scale = Math.pow(10, adjustedTier * 3);
  const scaled = amount / scale;

  const formattedNumber =
    scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);

  return formattedNumber + suffix;
};
