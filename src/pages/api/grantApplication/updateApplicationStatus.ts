import axios from 'axios';
import type { NextApiResponse } from 'next';

import { type NextApiRequestWithUser, withAuth } from '@/features/auth';
import { convertGrantApplicationToAirtable } from '@/features/grants';
import { prisma } from '@/prisma';
import { airtableConfig, airtableUpsert, airtableUrl } from '@/utils/airtable';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  const userId = req.userId;

  if (!userId) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  const { id, applicationStatus, approvedAmount } = req.body;

  if (!id || !applicationStatus || approvedAmount === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const parsedAmount = parseInt(approvedAmount, 10);

  try {
    const currentApplication = await prisma.grantApplication.findUnique({
      where: {
        id,
      },
      include: {
        grant: true,
        user: true,
      },
    });

    if (user.currentSponsorId !== currentApplication?.grant.sponsorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await prisma.grantApplication.update({
      where: {
        id,
      },
      data: {
        applicationStatus,
        approvedAmount: parsedAmount,
      },
      include: {
        user: true,
        grant: true,
      },
    });

    await prisma.grants.update({
      where: {
        id: result.grantId,
      },
      data: {
        totalApproved: {
          increment: parsedAmount,
        },
      },
    });

    const config = airtableConfig(process.env.AIRTABLE_GRANTS_API_TOKEN!);
    const url = airtableUrl(
      process.env.AIRTABLE_GRANTS_BASE_ID!,
      process.env.AIRTABLE_GRANTS_TABLE_NAME!,
    );

    const airtableData = convertGrantApplicationToAirtable(result);
    const airtablePayload = airtableUpsert('earnGrantApplicationId', [
      { fields: airtableData },
    ]);

    await axios.patch(url, JSON.stringify(airtablePayload), config);

    return res.status(200).json(result);
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while updating the grant application.',
    });
  }
}

export default withAuth(handler);
