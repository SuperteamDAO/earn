const totalPrizeFormat = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 2,
});

export const formatTotalPrize = (total: number) =>
  totalPrizeFormat.format(total as number);
