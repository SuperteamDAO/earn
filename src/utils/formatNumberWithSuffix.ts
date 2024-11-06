export const formatNumberWithSuffix = (
  amount: number,
  decimals: number = 2,
  skipThousands: boolean = false,
) => {
  if (isNaN(amount)) return null;

  if (amount < 1000) return amount;

  const suffixes = ['', 'k', 'M', 'B'];
  let tier = (Math.log10(amount) / 3) | 0;

  // adjust tier if skipping thousands
  if (skipThousands && tier === 1 && amount < 10000) {
    tier = 0;
  }

  if (tier === 0) return amount.toLocaleString('en-us');

  const suffix = suffixes[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = amount / scale;

  let formattedNumber;
  if (tier === 1) {
    formattedNumber = scaled
      .toFixed(decimals)
      .replace(/\.?0+$/, '')
      .toLocaleString();
  } else {
    formattedNumber =
      scaled % 1 === 0
        ? scaled.toLocaleString('en-us')
        : scaled.toFixed(1).replace(/\.0$/, '').toLocaleString();
  }

  return formattedNumber + suffix;
};
