import { type NextApiRequest, type NextApiResponse } from 'next';

import { prisma } from '@/prisma';

interface OldPaymentDetails {
  txId: string;
}

interface NewPaymentDetails {
  txId: string;
  amount: number;
  tranche: number;
}

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const submissionsWithPayments = await prisma.submission.findMany({
      where: {
        isPaid: true,
      },
      include: {
        listing: true,
      },
    });

    const validSubmissions = submissionsWithPayments.filter(
      (submission) => submission.paymentDetails !== null,
    );

    let migratedCount = 0;
    let errorCount = 0;

    for (const submission of validSubmissions) {
      try {
        const paymentDetails = submission.paymentDetails as any;

        if (Array.isArray(paymentDetails)) {
          continue;
        }

        if (typeof paymentDetails === 'object' && paymentDetails.txId) {
          const oldDetails = paymentDetails as OldPaymentDetails;

          if (!submission.winnerPosition || !submission.listing?.rewards) {
            continue;
          }

          const rewards = submission.listing.rewards as Record<string, number>;
          const amount = rewards[submission.winnerPosition.toString()];

          if (!amount) {
            continue;
          }

          const newPaymentDetails: NewPaymentDetails[] = [
            {
              txId: oldDetails.txId,
              amount: amount,
              tranche: 1,
            },
          ];

          await prisma.submission.update({
            where: {
              id: submission.id,
            },
            data: {
              paymentDetails: newPaymentDetails as any,
            },
          });

          console.log(
            `✅ Migrated submission ${submission.id} - amount: ${amount}, txId: ${oldDetails.txId}`,
          );
          migratedCount++;
        }
      } catch (error) {
        console.error(`❌ Error migrating submission ${submission.id}:`, error);
        errorCount++;
      }
    }

    return res.status(200).json({
      message: 'Migration completed',
      migratedCount,
      errorCount,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Migration failed',
      error,
    });
  }
}
