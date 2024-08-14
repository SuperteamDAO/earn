import axios from 'axios';
import type { NextApiResponse } from 'next';

import {
  checkGrantSponsorAuth,
  type NextApiRequestWithSponsor,
  withSponsorAuth,
} from '@/features/auth';
import { sendEmailNotification } from '@/features/emails';
import { convertGrantApplicationToAirtable } from '@/features/grants';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { airtableConfig, airtableUpsert, airtableUrl } from '@/utils/airtable';
import { fetchTokenUSDValue } from '@/utils/fetchTokenUSDValue';
import { safeStringify } from '@/utils/safeStringify';

const MAX_RECORDS = 10;

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  const { data, applicationStatus } = req.body as {
    data: {
      id: string;
      approvedAmount?: number;
    }[];
    applicationStatus: string;
  };

  if (!data || !applicationStatus) {
    logger.warn('Missing required fields: data or applicationStatus');
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (data.length === 0) {
    logger.warn('Data asked to update is empty');
    return res.status(400).json({ error: 'Data asked to update is empty' });
  }
  if (data.length > MAX_RECORDS) {
    logger.warn('Only max 10 records allowed in data');
    return res
      .status(400)
      .json({ error: 'Only max 10 records allowed in data' });
  }

  // if (typeof id === 'string') {
  //   id = [id]
  // }

  // const parsedAmount = approvedAmount ? parseInt(approvedAmount, 10) : 0;

  try {
    console.log(
      'appl ids - ',
      data.map((d) => d.id),
    );
    const currentApplications = await prisma.grantApplication.findMany({
      where: {
        id: {
          in: data.map((d) => d.id),
        },
      },
      include: {
        grant: true,
      },
    });

    if (currentApplications.length !== data.length) {
      logger.warn(
        `Some records were not found in the data - only found these - ${currentApplications.map((c) => c.id)}`,
      );
      return res.status(404).json({
        error: `Some records were not found in the data - only found these - ${currentApplications.map((c) => c.id)}`,
      });
    }
    const grantId = currentApplications[0]?.grant.id;
    if (
      grantId &&
      !currentApplications.every(
        (application) => application.grant.id === grantId,
      )
    ) {
      logger.warn('All records should have same and valid grant ID');
      return res
        .status(404)
        .json({ error: 'All records should have same and valid grant ID' });
    }

    currentApplications.forEach(async (currentApplicant) => {
      const { error } = await checkGrantSponsorAuth(
        req.userSponsorId,
        currentApplicant.grantId,
      );
      if (error) {
        return res.status(error.status).json({ error: error.message });
      }
    });

    const commonUpdateField = {
      applicationStatus,
      decidedAt: new Date().toISOString(),
    };

    const updatedData: {
      applicationStatus: string;
      decidedAt: string;
      approvedAmount?: number;
      approvedAmountInUSD?: number;
    }[] = [];

    const isApproved = applicationStatus === 'Approved';

    currentApplications.forEach(async (currentApplicant, k) => {
      let approvedData = {
        approvedAmount: 0,
        approvedAmountInUSD: 0,
      };
      if (isApproved) {
        const parsedAmount = data[k]?.approvedAmount
          ? parseInt(data[k]?.approvedAmount + '', 10)
          : 0;
        const tokenUSDValue = await fetchTokenUSDValue(
          currentApplicant.grant.token!,
        );
        const usdValue = tokenUSDValue * parsedAmount;
        approvedData = {
          approvedAmount: parsedAmount,
          approvedAmountInUSD: usdValue,
        };
      }
      updatedData.push({
        ...commonUpdateField,
        ...approvedData,
      });
    });

    console.log('update data - ', updatedData);
    const result = await prisma.$transaction(
      currentApplications.map((application, k) => {
        console.log('to be updated - ', updatedData[k]);
        return prisma.grantApplication.update({
          where: { id: application.id },
          data: updatedData[k] as any,
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                twitter: true,
                discord: true,
              },
            },
            grant: {
              select: {
                airtableId: true,
                isNative: true,
              },
            },
          },
        });
      }),
    );

    if (isApproved) {
      const totalIncrementAmount = data.reduce((acc, currentApplicant) => {
        if (currentApplicant.approvedAmount !== undefined) {
          return acc + currentApplicant.approvedAmount;
        }
        return acc;
      }, 0);
      await prisma.grants.update({
        where: { id: grantId },
        data: {
          totalApproved: {
            increment: totalIncrementAmount,
          },
        },
      });
    }

    if (result[0]?.grant.isNative === true && !result[0]?.grant.airtableId) {
      result.map(async (r) => {
        try {
          await sendEmailNotification({
            type: isApproved ? 'grantApproved' : 'grantRejected',
            id: r.id,
            userId: r.userId,
            triggeredBy: userId,
          });
        } catch (err) {
          logger.error('Error sending email to Sponsor:', err);
        }
      });
    } else {
      const config = airtableConfig(process.env.AIRTABLE_GRANTS_API_TOKEN!);
      const url = airtableUrl(
        process.env.AIRTABLE_GRANTS_BASE_ID!,
        process.env.AIRTABLE_GRANTS_TABLE_NAME!,
      );

      const airtableData = result.map((r) =>
        convertGrantApplicationToAirtable(r),
      );
      const airtablePayload = airtableUpsert(
        'earnApplicationId',
        airtableData.map((a) => ({ fields: a })),
      );

      await axios.patch(url, JSON.stringify(airtablePayload), config);
    }

    return res.status(200).json({ message: 'Success' });
  } catch (error: any) {
    logger.error(
      `Error occurred while updating grant application ID: ${data.map((c) => c.id)}:  ${error.message}`,
    );
    return res.status(500).json({
      error: error.message,
      message: 'Error occurred while updating the grant application.',
    });
  }
}

export default withSponsorAuth(handler);
