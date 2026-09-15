import { prisma } from '@/prisma';
import { Prisma } from '@/prisma/client';

type PrismaLike = Pick<typeof prisma, '$queryRaw'>;

type PaymentReplayRow = {
  txId: string;
};

const MAX_TX_IDS_PER_REPLAY_CHECK = 25;

export function normalizePaymentTxId(txId: string) {
  const trimmedTxId = txId.trim();

  try {
    const url = new URL(trimmedTxId);
    const match = url.pathname.match(/\/tx\/([A-Za-z0-9]+)/);
    return match?.[1] ?? trimmedTxId;
  } catch {
    const match = trimmedTxId.match(/\/tx\/([A-Za-z0-9]+)/);
    return match?.[1] ?? trimmedTxId;
  }
}

function escapeJsonSearchPattern(value: string) {
  return value.replace(/[\\%_]/g, '\\$&');
}

function paymentTxSearchPatterns(txId: string) {
  const escapedTxId = escapeJsonSearchPattern(txId);

  return [
    escapedTxId,
    `%/tx/${escapedTxId}`,
    `%/tx/${escapedTxId}?%`,
    `%/tx/${escapedTxId}#%`,
    `%/tx/${escapedTxId}/%`,
  ];
}

function buildJsonSearchExistsQuery(
  tableName: 'GrantApplication' | 'Submission',
) {
  return (txId: string) => {
    const searchPredicates = paymentTxSearchPatterns(txId).map(
      (pattern) =>
        Prisma.sql`JSON_SEARCH(JSON_EXTRACT(paymentDetails, '$[*].txId'), 'one', ${pattern}) IS NOT NULL`,
    );

    return Prisma.sql`
      EXISTS (
        SELECT 1
        FROM ${Prisma.raw(`\`${tableName}\``)}
        WHERE paymentDetails IS NOT NULL
          AND (${Prisma.join(searchPredicates, ' OR ')})
        LIMIT 1
      )
    `;
  };
}

export async function findUsedPaymentTxIds(
  txIds: string[],
  client: PrismaLike = prisma,
) {
  const uniqueTxIds = [
    ...new Set(txIds.filter(Boolean).map(normalizePaymentTxId)),
  ];
  if (uniqueTxIds.length === 0) return [];

  if (uniqueTxIds.length > MAX_TX_IDS_PER_REPLAY_CHECK) {
    throw new Error(
      `Cannot check more than ${MAX_TX_IDS_PER_REPLAY_CHECK} transaction IDs at once`,
    );
  }

  const submissionHasPaymentTxId = buildJsonSearchExistsQuery('Submission');
  const grantHasPaymentTxId = buildJsonSearchExistsQuery('GrantApplication');

  const replayChecks = uniqueTxIds.map(
    (txId) => Prisma.sql`
      SELECT ${txId} AS txId
      WHERE ${submissionHasPaymentTxId(txId)}
         OR ${grantHasPaymentTxId(txId)}
    `,
  );

  const rows = await client.$queryRaw<PaymentReplayRow[]>(
    Prisma.sql`${Prisma.join(replayChecks, ' UNION ALL ')}`,
  );

  return [...new Set(rows.map((row) => row.txId))];
}
