import { type NextApiRequest, type NextApiResponse } from 'next';

import { prisma } from '@/prisma';

import { addPaymentInfoToAirtable } from '@/features/grants/utils/addPaymentInfoToAirtable';

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  const tranche = await prisma.grantTranche.findFirstOrThrow({
    where: { applicationId: 'cc6637c4-bdaf-4d2a-81ea-4650a548cdb0' },
    include: {
      GrantApplication: {
        include: {
          user: {
            select: {
              username: true,
              kycName: true,
              kycAddress: true,
              kycDOB: true,
              kycIDNumber: true,
              kycIDType: true,
              kycCountry: true,
              email: true,
              location: true,
            },
          },
          grant: true,
        },
      },
    },
  });

  await addPaymentInfoToAirtable(tranche.GrantApplication, tranche);

  res.status(200).json({ message: 'done' });
}
