import axios from 'axios';
import type { NextApiResponse } from 'next';
import { z } from 'zod';

import { tokenList } from '@/constants/tokenList';
import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { airtableConfig, airtableUpsert, airtableUrl } from '@/utils/airtable';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkGrantSponsorAuth } from '@/features/auth/utils/checkGrantSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';
import { sendEmailNotification } from '@/features/emails/utils/sendEmailNotification';
import { convertGrantApplicationToAirtable } from '@/features/grants/utils/convertGrantApplicationToAirtable';
import { fetchTokenUSDValue } from '@/features/wallet/utils/fetchTokenUSDValue';

const MAX_RECORDS = 10;

const UpdateGrantApplicationSchema = z.object({
  data: z
    .array(
      z.object({
        id: z.string(),
        approvedAmount: z.union([z.number().int().min(0), z.null()]).optional(),
      }),
    )
    .min(1, 'Data array cannot be empty')
    .max(MAX_RECORDS, `Only max ${MAX_RECORDS} records allowed in data`),
  applicationStatus: z.string(),
});

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;

  logger.debug(`Request body: ${safeStringify(req.body)}`);

  const validationResult = UpdateGrantApplicationSchema.safeParse(req.body);

  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    logger.warn('Invalid request body:', errorMessage);
    return res.status(400).json({
      error: 'Invalid request body',
      details: errorMessage,
    });
  }

  const { data, applicationStatus } = validationResult.data;

  try {
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
      decidedBy: userId,
    };

    const isApproved = applicationStatus === 'Approved';
    const updatedData: {
      applicationStatus: string;
      decidedAt: string;
      decidedBy: string | undefined;
      approvedAmount?: number;
      approvedAmountInUSD?: number;
    }[] = [];

    await Promise.all(
      currentApplications.map(async (currentApplicant, k) => {
        let approvedData = {
          approvedAmount: 0,
          approvedAmountInUSD: 0,
        };
        if (isApproved) {
          const parsedAmount = data[k]?.approvedAmount
            ? parseInt(data[k]?.approvedAmount + '', 10)
            : 0;

          if (!currentApplicant.grant.maxReward) {
            throw new Error(
              `Grant ${currentApplicant.grantId} has no maximum reward limit set`,
            );
          }
          if (parsedAmount > currentApplicant.grant.maxReward) {
            throw new Error(
              `Approved amount ${parsedAmount} exceeds maximum reward limit of ${currentApplicant.grant.maxReward} for application ${currentApplicant.id}`,
            );
          }
          const token = tokenList.find(
            (t) => t.tokenSymbol === currentApplicant.grant.token!,
          );
          const tokenUSDValue = await fetchTokenUSDValue(token?.mintAddress!);
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
      }),
    );

    const result = await prisma.$transaction(
      currentApplications.map((application, k) => {
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
                walletAddress: true,
              },
            },
            grant: {
              select: {
                airtableId: true,
                isNative: true,
                title: true,
              },
            },
          },
        });
      }),
    );

    if (isApproved) {
      const totalIncrementAmountInUSD = updatedData.reduce(
        (acc, currentApplicant) => {
          if (currentApplicant.approvedAmountInUSD !== undefined) {
            return acc + currentApplicant.approvedAmountInUSD;
          }
          return acc;
        },
        0,
      );
      await prisma.grants.update({
        where: { id: grantId },
        data: {
          totalApproved: {
            increment: totalIncrementAmountInUSD,
          },
        },
      });
    }

    if (result[0]?.grant.isNative === true && !result[0]?.grant.airtableId) {
      result.forEach(async (r) => {
        sendEmailNotification({
          type: isApproved ? 'grantApproved' : 'grantRejected',
          id: r.id,
          userId: r.userId,
          triggeredBy: userId,
        });
      });
    }

    if (result[0]?.grant.airtableId) {
      console.log('is an airtable grant');
      try {
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
        logger.info('Starting Airtable sync...');
        const syncPromise = axios.patch(
          url,
          JSON.stringify(airtablePayload),
          config,
        );
        logger.info('Waiting for Airtable sync to complete...');
        const response = await syncPromise;
        logger.info('Airtable sync completed successfully');
        logger.info('Airtable sync completed with response:', {
          status: response.status,
          data: response.data,
          applicationIds: result.map((r) => r.id),
        });
      } catch (err) {
        logger.error('Error syncing with Airtable', err);
      }
    }

    return res.status(200).json(result);
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
