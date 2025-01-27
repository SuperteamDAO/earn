import axios from 'axios';
import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import {
  airtableConfig,
  airtableUrl,
  fetchAirtableRecordId,
} from '@/utils/airtable';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';
import { extractSocialUsername } from '@/features/social/utils/extractUsername';
import { sponsorBaseSchema } from '@/features/sponsor/utils/sponsorFormSchema';

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;

  try {
    const userSponsorId = req.userSponsorId;

    if (!userSponsorId) {
      logger.warn(`User ${userId} does not have a current sponsor`);
      return res
        .status(403)
        .json({ error: 'User does not have a current sponsor' });
    }

    logger.debug(`Request body: ${safeStringify(req.body)}`);

    const validationResult = sponsorBaseSchema.safeParse({
      ...req.body,
      twitter:
        req.body.twitter !== undefined
          ? extractSocialUsername('twitter', req.body.twitter) || ''
          : undefined,
    });

    if (!validationResult.success) {
      logger.warn(
        `Invalid sponsor data: ${safeStringify(validationResult.error)}`,
      );
      return res.status(400).json({
        error: 'Invalid sponsor data',
        details: validationResult.error.errors,
      });
    }

    const { name, slug, logo, url, industry, twitter, bio, entityName } =
      validationResult.data;

    const preSponsor = await prisma.sponsors.findUnique({
      where: {
        id: userSponsorId,
      },
      select: { name: true },
    });

    const result = await prisma.sponsors.update({
      where: {
        id: userSponsorId,
      },
      data: {
        name,
        slug,
        logo,
        url,
        industry,
        twitter,
        bio,
        entityName,
      },
    });

    if (preSponsor && preSponsor.name !== name) {
      try {
        const gdpAirtableConfig = airtableConfig(
          process.env.AIRTABLE_GDP_API_TOKEN!,
        );
        const sponsorAirtableURL = airtableUrl(
          process.env.AIRTABLE_GDP_BASE_ID!,
          process.env.AIRTABLE_GDP_SPONSORS_TABLE_NAME!,
        );

        const sponsorRecordId = await fetchAirtableRecordId(
          sponsorAirtableURL,
          'Name',
          preSponsor.name,
          gdpAirtableConfig,
        );

        if (sponsorRecordId) {
          await axios.patch(
            sponsorAirtableURL,
            JSON.stringify({
              records: [
                {
                  id: sponsorRecordId,
                  fields: {
                    Name: name,
                  },
                },
              ],
            }),
            gdpAirtableConfig,
          );
        }
      } catch (err) {
        logger.error(`Airtable update of sponsor name failed: ${err}`, {
          err,
        });
      }
    }
    logger.info(`Sponsor updated successfully for user: ${userId}`);
    return res.status(200).json(result);
  } catch (error: any) {
    logger.error(
      `Error occurred while updating sponsor for user ${userId}: ${error.message}`,
    );
    return res.status(500).json({
      error: error.message || 'Internal server error',
      message: 'Error occurred while updating sponsor.',
    });
  }
}

export default withSponsorAuth(handler);
