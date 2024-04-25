export const formatNumberWithSuffix = (amount: number) => {
  if (isNaN(amount)) return null;

  if (amount < 1000) return amount?.toString();

  const suffixes = ['', 'k', 'm', 'b'];
  const tier = (Math.log10(amount) / 3) | 0;

  const adjustedTier = tier;

  if (adjustedTier === 0) return amount.toString();

  const suffix = suffixes[adjustedTier];
  const scale = Math.pow(10, adjustedTier * 3);
  const scaled = amount / scale;

  let formattedNumber;
  if (adjustedTier === 1) {
    formattedNumber = scaled.toFixed(2).replace(/\.?0+$/, '');
  } else {
    formattedNumber =
      scaled % 1 === 0
        ? scaled.toString()
        : scaled.toFixed(1).replace(/\.0$/, '');
  }

  return formattedNumber + suffix;
};
