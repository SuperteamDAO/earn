// `paymentDetails` is a JSON column of { txId, amount, tranche } entries. Stored
// entries are written back as-is, so only the amount is read through this.
export function getPaymentAmount(payment: unknown): number {
  if (typeof payment !== 'object' || payment === null) return 0;
  const { amount } = payment as { amount?: unknown };
  return typeof amount === 'number' ? amount : 0;
}
