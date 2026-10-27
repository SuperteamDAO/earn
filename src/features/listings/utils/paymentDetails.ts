import {
  type JsonArray,
  type JsonValue,
} from '@/prisma/internal/prismaNamespace';

// `paymentDetails` is a JSON column of { txId, amount, tranche } entries. Stored
// entries are written back as-is, so only the amount is read through this.
export function getPaymentAmount(payment: unknown): number {
  if (typeof payment !== 'object' || payment === null) return 0;
  const { amount } = payment as { amount?: unknown };
  return typeof amount === 'number' ? amount : 0;
}

// null means the column holds something other than a payment array; callers
// refuse to append to it rather than overwrite history they cannot read.
export function readPaymentHistory(
  value: JsonValue | undefined,
): JsonArray | null {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : null;
}
