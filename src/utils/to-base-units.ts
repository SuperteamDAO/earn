export function toBaseUnits(amountStr: string, decimals: number): bigint {
  const [whole = '0', frac = ''] = amountStr.split('.');
  const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals);
  const wholePart = BigInt(whole || '0');
  const fracPart = BigInt(fracPadded || '0');
  return wholePart * 10n ** BigInt(decimals) + fracPart;
}
